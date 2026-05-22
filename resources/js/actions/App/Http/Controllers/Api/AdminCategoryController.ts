import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
const index029b5c5da98b03e3d218bf29682b5f92 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index029b5c5da98b03e3d218bf29682b5f92.url(options),
    method: 'get',
})

index029b5c5da98b03e3d218bf29682b5f92.definition = {
    methods: ["get","head"],
    url: '/api/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
index029b5c5da98b03e3d218bf29682b5f92.url = (options?: RouteQueryOptions) => {
    return index029b5c5da98b03e3d218bf29682b5f92.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
index029b5c5da98b03e3d218bf29682b5f92.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index029b5c5da98b03e3d218bf29682b5f92.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
index029b5c5da98b03e3d218bf29682b5f92.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index029b5c5da98b03e3d218bf29682b5f92.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
    const index029b5c5da98b03e3d218bf29682b5f92Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index029b5c5da98b03e3d218bf29682b5f92.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
        index029b5c5da98b03e3d218bf29682b5f92Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index029b5c5da98b03e3d218bf29682b5f92.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/categories'
 */
        index029b5c5da98b03e3d218bf29682b5f92Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index029b5c5da98b03e3d218bf29682b5f92.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index029b5c5da98b03e3d218bf29682b5f92.form = index029b5c5da98b03e3d218bf29682b5f92Form
    /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
const index771dad12bbe1adde455d808763b2e535 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index771dad12bbe1adde455d808763b2e535.url(options),
    method: 'get',
})

index771dad12bbe1adde455d808763b2e535.definition = {
    methods: ["get","head"],
    url: '/api/admin/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
index771dad12bbe1adde455d808763b2e535.url = (options?: RouteQueryOptions) => {
    return index771dad12bbe1adde455d808763b2e535.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
index771dad12bbe1adde455d808763b2e535.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index771dad12bbe1adde455d808763b2e535.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
index771dad12bbe1adde455d808763b2e535.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index771dad12bbe1adde455d808763b2e535.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
    const index771dad12bbe1adde455d808763b2e535Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index771dad12bbe1adde455d808763b2e535.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
        index771dad12bbe1adde455d808763b2e535Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index771dad12bbe1adde455d808763b2e535.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::index
 * @see app/Http/Controllers/Api/AdminCategoryController.php:15
 * @route '/api/admin/categories'
 */
        index771dad12bbe1adde455d808763b2e535Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index771dad12bbe1adde455d808763b2e535.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index771dad12bbe1adde455d808763b2e535.form = index771dad12bbe1adde455d808763b2e535Form

export const index = {
    '/api/categories': index029b5c5da98b03e3d218bf29682b5f92,
    '/api/admin/categories': index771dad12bbe1adde455d808763b2e535,
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::store
 * @see app/Http/Controllers/Api/AdminCategoryController.php:38
 * @route '/api/admin/categories'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/admin/categories',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::store
 * @see app/Http/Controllers/Api/AdminCategoryController.php:38
 * @route '/api/admin/categories'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::store
 * @see app/Http/Controllers/Api/AdminCategoryController.php:38
 * @route '/api/admin/categories'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryController::store
 * @see app/Http/Controllers/Api/AdminCategoryController.php:38
 * @route '/api/admin/categories'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::store
 * @see app/Http/Controllers/Api/AdminCategoryController.php:38
 * @route '/api/admin/categories'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\AdminCategoryController::update
 * @see app/Http/Controllers/Api/AdminCategoryController.php:68
 * @route '/api/admin/categories/{category}'
 */
export const update = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/admin/categories/{category}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::update
 * @see app/Http/Controllers/Api/AdminCategoryController.php:68
 * @route '/api/admin/categories/{category}'
 */
update.url = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { category: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    category: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        category: typeof args.category === 'object'
                ? args.category.id
                : args.category,
                }

    return update.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::update
 * @see app/Http/Controllers/Api/AdminCategoryController.php:68
 * @route '/api/admin/categories/{category}'
 */
update.put = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryController::update
 * @see app/Http/Controllers/Api/AdminCategoryController.php:68
 * @route '/api/admin/categories/{category}'
 */
    const updateForm = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::update
 * @see app/Http/Controllers/Api/AdminCategoryController.php:68
 * @route '/api/admin/categories/{category}'
 */
        updateForm.put = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Api\AdminCategoryController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryController.php:90
 * @route '/api/admin/categories/{category}'
 */
export const destroy = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/admin/categories/{category}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryController.php:90
 * @route '/api/admin/categories/{category}'
 */
destroy.url = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { category: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    category: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        category: typeof args.category === 'object'
                ? args.category.id
                : args.category,
                }

    return destroy.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCategoryController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryController.php:90
 * @route '/api/admin/categories/{category}'
 */
destroy.delete = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\AdminCategoryController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryController.php:90
 * @route '/api/admin/categories/{category}'
 */
    const destroyForm = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCategoryController::destroy
 * @see app/Http/Controllers/Api/AdminCategoryController.php:90
 * @route '/api/admin/categories/{category}'
 */
        destroyForm.delete = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const AdminCategoryController = { index, store, update, destroy }

export default AdminCategoryController