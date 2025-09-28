<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ItemUnit;

class ItemUnitController extends Controller
{
    public function scan($code)
    {
        $unit = ItemUnit::where('unit_code', $code)->with('item')->first();

        if (!$unit) {
            return response()->json(['message' => 'Unit not found'], 404);
        }

        return response()->json($unit);
    }
}
