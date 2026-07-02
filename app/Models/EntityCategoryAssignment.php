<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntityCategoryAssignment extends Model
{
    protected $fillable = ['entity_type', 'entity_id', 'category_type_id', 'category_value_id'];

    protected $table = 'entity_category_assignments';

    public function categoryType()
    {
        return $this->belongsTo(CategoryType::class);
    }

    public function categoryValue()
    {
        return $this->belongsTo(CategoryValue::class, 'category_value_id');
    }
}
