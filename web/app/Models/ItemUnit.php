<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemUnit extends Model
{
    protected $fillable = [
        'item_id',
        'unit_code',
        'qr_path',
        'status',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    // optional: helper for full URL
    public function getQrUrlAttribute()
    {
        return $this->qr_path ? asset('storage/' . $this->qr_path) : null;
    }

    protected $appends = ['qr_url'];
}
