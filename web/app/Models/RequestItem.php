<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestItem extends Model
{
    protected $table = 'requests';

    protected $fillable = [
        'name',
        'borrower_id',
        'year',
        'department',
        'course',
        'date',
        'time_in',
        'time_out',
        'item_id',
        'status', // add this
        'email',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}