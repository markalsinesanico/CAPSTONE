<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\ItemUnit;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
{
    public function index()
    {
        return Item::with('units')->orderBy('created_at','desc')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'qty' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('items', 'public');
        }

        // wrap creation and QR generation in a transaction so we don't leave
        // partially-created state (DB rows or files) on errors
        try {
            DB::beginTransaction();


            $item = Item::create($data);

            // Generate item units + QR codes
            $createdQrFiles = $this->createUnitsAndQRCodes($item, (int) $data['qty']);

            DB::commit();

            return response()->json($item->load('units'), 201);
        } catch (ValidationException $ve) {
            // return validation errors
            return response()->json(['message' => 'Validation failed', 'errors' => $ve->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            // cleanup uploaded image if present
            if (!empty($data['image'])) {
                try { Storage::disk('public')->delete($data['image']); } catch (\Exception $ex) { /* ignore */ }
            }

            // cleanup any generated QR files
            if (!empty($createdQrFiles) && is_array($createdQrFiles)) {
                foreach ($createdQrFiles as $f) {
                    try { if (File::exists($f)) File::delete($f); } catch (\Exception $ex) { /* ignore */ }
                }
            }

            // log the actual exception for debugging
            \Log::error('Failed to create item', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json(['message' => 'Failed to add item', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Item $item)
    {
        return $item->load('units');
    }

    public function update(Request $request, Item $item)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'qty' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old
            if ($item->image) Storage::disk('public')->delete($item->image);
            $data['image'] = $request->file('image')->store('items', 'public');
        }

        $item->update($data);

        // Adjust units if qty changed
        $newQty = (int) $data['qty'];
        $currentQty = $item->units()->count();

        if ($newQty > $currentQty) {
            $this->createUnitsAndQRCodes($item, $newQty - $currentQty);
        } elseif ($newQty < $currentQty) {
            $toRemove = $currentQty - $newQty;
            $units = ItemUnit::where('item_id', $item->id)
                ->where('status', 'available')
                ->orderBy('created_at', 'desc')
                ->take($toRemove)
                ->get();

            foreach ($units as $unit) {
                $file = storage_path('app/public/' . $unit->qr_path);
                if (File::exists($file)) File::delete($file);
                $unit->delete();
            }
        }

        return response()->json($item->load('units'));
    }

    public function destroy(Item $item)
    {
        foreach ($item->units as $unit) {
            $file = storage_path('app/public/' . $unit->qr_path);
            if (File::exists($file)) File::delete($file);
        }

        if ($item->image) Storage::disk('public')->delete($item->image);

        $item->delete();
        return response()->json(['message' => 'Item deleted']);
    }

    private function createUnitsAndQRCodes(Item $item, int $qty)
    {
        $dir = storage_path('app/public/qrcodes');
        if (!File::exists($dir)) File::makeDirectory($dir, 0755, true);

        $toInsert = [];
        $createdFiles = [];
        for ($i = 1; $i <= $qty; $i++) {
            $unitCode = (string) Str::uuid();
            // Use SVG output for QR codes to avoid requiring the Imagick PHP extension
            // (SVG rendering doesn't need Imagick/GD). Store files with .svg extension.
            $filename = "item_{$item->id}_unit_{$unitCode}.svg";
            $relativePath = "qrcodes/{$filename}";

            $payload = $unitCode;

            QrCode::format('svg')
                ->size(400)
                ->generate($payload, storage_path('app/public/' . $relativePath));

            $createdFiles[] = storage_path('app/public/' . $relativePath);

            $toInsert[] = [
                'item_id' => $item->id,
                'unit_code' => $unitCode,
                'qr_path' => $relativePath,
                'status' => 'available',
                'created_at'=> now(),
                'updated_at'=> now(),
            ];
        }

        ItemUnit::insert($toInsert);

        return $createdFiles;
    }

    public function units(Item $item)
    {
        return $item->units()->get()->map(function($u) {
            return [
                'id' => $u->id,
                'unit_code' => $u->unit_code,
                'status' => $u->status,
                'qr_url' => $u->qr_url,
            ];
        });
    }

    public function downloadQRCodesZip(Item $item)
    {
        $units = $item->units;
        $zipName = "item_{$item->id}_qrcodes.zip";
        $tempPath = storage_path("app/public/qrcodes_tmp/{$zipName}");

        if (!File::exists(dirname($tempPath))) {
            File::makeDirectory(dirname($tempPath), 0755, true);
        }

        $zip = new \ZipArchive;
        if ($zip->open($tempPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            foreach ($units as $unit) {
                $filePath = storage_path('app/public/' . $unit->qr_path);
                if (File::exists($filePath)) {
                    $zip->addFile($filePath, basename($filePath));
                }
            }
            $zip->close();
            return response()->download($tempPath)->deleteFileAfterSend(true);
        }

        return response()->json(['message' => 'Failed to create zip'], 500);
    }
}


