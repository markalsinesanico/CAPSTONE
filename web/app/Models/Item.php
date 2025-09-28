<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = ['name', 'qty', 'image', 'description'];

    // append an easy-to-use full URL to the JSON
    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
    public function units()
{
    return $this->hasMany(ItemUnit::class);
}
}
