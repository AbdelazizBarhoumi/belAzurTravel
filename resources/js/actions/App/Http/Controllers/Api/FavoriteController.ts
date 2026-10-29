import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/favorites',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\FavoriteController::index
 * @see app/Http/Controllers/Api/FavoriteController.php:16
 * @route '/api/favorites'
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
* @see \App\Http\Controllers\Api\FavoriteController::store
 * @see app/Http/Controllers/Api/FavoriteController.php:21
 * @route '/api/favorites'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/favorites',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\FavoriteController::store
 * @see app/Http/Controllers/Api/FavoriteController.php:21
 * @route '/api/favorites'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FavoriteController::store
 * @see app/Http/Controllers/Api/FavoriteController.php:21
 * @route '/api/favorites'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\FavoriteController::store
 * @see app/Http/Controllers/Api/FavoriteController.php:21
 * @route '/api/favorites'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\FavoriteController::store
 * @see app/Http/Controllers/Api/FavoriteController.php:21
 * @route '/api/favorites'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\FavoriteController::sync
 * @see app/Http/Controllers/Api/FavoriteController.php:48
 * @route '/api/favorites/sync'
 */
export const sync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

sync.definition = {
    methods: ["post"],
    url: '/api/favorites/sync',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\FavoriteController::sync
 * @see app/Http/Controllers/Api/FavoriteController.php:48
 * @route '/api/favorites/sync'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FavoriteController::sync
 * @see app/Http/Controllers/Api/FavoriteController.php:48
 * @route '/api/favorites/sync'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\FavoriteController::sync
 * @see app/Http/Controllers/Api/FavoriteController.php:48
 * @route '/api/favorites/sync'
 */
    const syncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\FavoriteController::sync
 * @see app/Http/Controllers/Api/FavoriteController.php:48
 * @route '/api/favorites/sync'
 */
        syncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sync.url(options),
            method: 'post',
        })
    
    sync.form = syncForm
/**
* @see \App\Http\Controllers\Api\FavoriteController::destroy
 * @see app/Http/Controllers/Api/FavoriteController.php:37
 * @route '/api/favorites/{type}/{key}'
 */
export const destroy = (args: { type: string | number, key: string | number } | [type: string | number, key: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/favorites/{type}/{key}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\FavoriteController::destroy
 * @see app/Http/Controllers/Api/FavoriteController.php:37
 * @route '/api/favorites/{type}/{key}'
 */
destroy.url = (args: { type: string | number, key: string | number } | [type: string | number, key: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    key: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                key: args.key,
                }

    return destroy.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{key}', parsedArgs.key.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FavoriteController::destroy
 * @see app/Http/Controllers/Api/FavoriteController.php:37
 * @route '/api/favorites/{type}/{key}'
 */
destroy.delete = (args: { type: string | number, key: string | number } | [type: string | number, key: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\FavoriteController::destroy
 * @see app/Http/Controllers/Api/FavoriteController.php:37
 * @route '/api/favorites/{type}/{key}'
 */
    const destroyForm = (args: { type: string | number, key: string | number } | [type: string | number, key: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\FavoriteController::destroy
 * @see app/Http/Controllers/Api/FavoriteController.php:37
 * @route '/api/favorites/{type}/{key}'
 */
        destroyForm.delete = (args: { type: string | number, key: string | number } | [type: string | number, key: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const FavoriteController = { index, store, sync, destroy }

export default FavoriteController