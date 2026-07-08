import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/admin/category-types',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::index
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:17
 * @route '/api/admin/category-types'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::store
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:40
 * @route '/api/admin/category-types'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/admin/category-types',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::store
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:40
 * @route '/api/admin/category-types'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::store
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:40
 * @route '/api/admin/category-types'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::store
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:40
 * @route '/api/admin/category-types'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::store
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:40
 * @route '/api/admin/category-types'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::reorder
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:296
 * @route '/api/admin/category-types/reorder'
 */
export const reorder = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reorder.url(options),
    method: 'post',
})

reorder.definition = {
    methods: ["post"],
    url: '/api/admin/category-types/reorder',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::reorder
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:296
 * @route '/api/admin/category-types/reorder'
 */
reorder.url = (options?: RouteQueryOptions) => {
    return reorder.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::reorder
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:296
 * @route '/api/admin/category-types/reorder'
 */
reorder.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reorder.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::reorder
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:296
 * @route '/api/admin/category-types/reorder'
 */
    const reorderForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reorder.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::reorder
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:296
 * @route '/api/admin/category-types/reorder'
 */
        reorderForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reorder.url(options),
            method: 'post',
        })
    
    reorder.form = reorderForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::update
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:73
 * @route '/api/admin/category-types/{categoryType}'
 */
export const update = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/admin/category-types/{categoryType}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::update
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:73
 * @route '/api/admin/category-types/{categoryType}'
 */
update.url = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoryType: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoryType: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoryType: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoryType: typeof args.categoryType === 'object'
                ? args.categoryType.id
                : args.categoryType,
                }

    return update.definition.url
            .replace('{categoryType}', parsedArgs.categoryType.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::update
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:73
 * @route '/api/admin/category-types/{categoryType}'
 */
update.put = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::update
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:73
 * @route '/api/admin/category-types/{categoryType}'
 */
    const updateForm = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::update
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:73
 * @route '/api/admin/category-types/{categoryType}'
 */
        updateForm.put = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:101
 * @route '/api/admin/category-types/{categoryType}'
 */
export const destroy = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/admin/category-types/{categoryType}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:101
 * @route '/api/admin/category-types/{categoryType}'
 */
destroy.url = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoryType: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoryType: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoryType: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoryType: typeof args.categoryType === 'object'
                ? args.categoryType.id
                : args.categoryType,
                }

    return destroy.definition.url
            .replace('{categoryType}', parsedArgs.categoryType.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:101
 * @route '/api/admin/category-types/{categoryType}'
 */
destroy.delete = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:101
 * @route '/api/admin/category-types/{categoryType}'
 */
    const destroyForm = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:101
 * @route '/api/admin/category-types/{categoryType}'
 */
        destroyForm.delete = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
export const values = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: values.url(args, options),
    method: 'get',
})

values.definition = {
    methods: ["get","head"],
    url: '/api/admin/category-types/{categoryType}/values',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
values.url = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoryType: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoryType: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoryType: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoryType: typeof args.categoryType === 'object'
                ? args.categoryType.id
                : args.categoryType,
                }

    return values.definition.url
            .replace('{categoryType}', parsedArgs.categoryType.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
values.get = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: values.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
values.head = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: values.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
    const valuesForm = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: values.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
        valuesForm.get = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: values.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::values
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:127
 * @route '/api/admin/category-types/{categoryType}/values'
 */
        valuesForm.head = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: values.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    values.form = valuesForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::storeValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:134
 * @route '/api/admin/category-types/{categoryType}/values'
 */
export const storeValue = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeValue.url(args, options),
    method: 'post',
})

storeValue.definition = {
    methods: ["post"],
    url: '/api/admin/category-types/{categoryType}/values',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::storeValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:134
 * @route '/api/admin/category-types/{categoryType}/values'
 */
storeValue.url = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoryType: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoryType: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoryType: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoryType: typeof args.categoryType === 'object'
                ? args.categoryType.id
                : args.categoryType,
                }

    return storeValue.definition.url
            .replace('{categoryType}', parsedArgs.categoryType.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::storeValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:134
 * @route '/api/admin/category-types/{categoryType}/values'
 */
storeValue.post = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeValue.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::storeValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:134
 * @route '/api/admin/category-types/{categoryType}/values'
 */
    const storeValueForm = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeValue.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::storeValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:134
 * @route '/api/admin/category-types/{categoryType}/values'
 */
        storeValueForm.post = (args: { categoryType: number | { id: number } } | [categoryType: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeValue.url(args, options),
            method: 'post',
        })
    
    storeValue.form = storeValueForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::updateValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:164
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
export const updateValue = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateValue.url(args, options),
    method: 'put',
})

updateValue.definition = {
    methods: ["put"],
    url: '/api/admin/category-types/{categoryType}/values/{value}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::updateValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:164
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
updateValue.url = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    categoryType: args[0],
                    value: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoryType: typeof args.categoryType === 'object'
                ? args.categoryType.id
                : args.categoryType,
                                value: typeof args.value === 'object'
                ? args.value.id
                : args.value,
                }

    return updateValue.definition.url
            .replace('{categoryType}', parsedArgs.categoryType.toString())
            .replace('{value}', parsedArgs.value.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::updateValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:164
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
updateValue.put = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateValue.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::updateValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:164
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
    const updateValueForm = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateValue.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::updateValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:164
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
        updateValueForm.put = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateValue.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateValue.form = updateValueForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroyValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:189
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
export const destroyValue = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyValue.url(args, options),
    method: 'delete',
})

destroyValue.definition = {
    methods: ["delete"],
    url: '/api/admin/category-types/{categoryType}/values/{value}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroyValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:189
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
destroyValue.url = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    categoryType: args[0],
                    value: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoryType: typeof args.categoryType === 'object'
                ? args.categoryType.id
                : args.categoryType,
                                value: typeof args.value === 'object'
                ? args.value.id
                : args.value,
                }

    return destroyValue.definition.url
            .replace('{categoryType}', parsedArgs.categoryType.toString())
            .replace('{value}', parsedArgs.value.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroyValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:189
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
destroyValue.delete = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyValue.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroyValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:189
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
    const destroyValueForm = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyValue.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryTypeController::destroyValue
 * @see app/Http/Controllers/Api/AdminCategoryTypeController.php:189
 * @route '/api/admin/category-types/{categoryType}/values/{value}'
 */
        destroyValueForm.delete = (args: { categoryType: number | { id: number }, value: number | { id: number } } | [categoryType: number | { id: number }, value: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyValue.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyValue.form = destroyValueForm
const AdminCategoryTypeController = { index, store, reorder, update, destroy, values, storeValue, updateValue, destroyValue }

export default AdminCategoryTypeController