import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
const index63ffdcb22e380c6a2b7ba47de5eb4449 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index63ffdcb22e380c6a2b7ba47de5eb4449.url(options),
    method: 'get',
})

index63ffdcb22e380c6a2b7ba47de5eb4449.definition = {
    methods: ["get","head"],
    url: '/api/gallery',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
index63ffdcb22e380c6a2b7ba47de5eb4449.url = (options?: RouteQueryOptions) => {
    return index63ffdcb22e380c6a2b7ba47de5eb4449.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
index63ffdcb22e380c6a2b7ba47de5eb4449.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index63ffdcb22e380c6a2b7ba47de5eb4449.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
index63ffdcb22e380c6a2b7ba47de5eb4449.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index63ffdcb22e380c6a2b7ba47de5eb4449.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
    const index63ffdcb22e380c6a2b7ba47de5eb4449Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index63ffdcb22e380c6a2b7ba47de5eb4449.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
        index63ffdcb22e380c6a2b7ba47de5eb4449Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index63ffdcb22e380c6a2b7ba47de5eb4449.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/gallery'
 */
        index63ffdcb22e380c6a2b7ba47de5eb4449Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index63ffdcb22e380c6a2b7ba47de5eb4449.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index63ffdcb22e380c6a2b7ba47de5eb4449.form = index63ffdcb22e380c6a2b7ba47de5eb4449Form
    /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
const indexbd56c31c252751f65cdc675a47d13916 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexbd56c31c252751f65cdc675a47d13916.url(options),
    method: 'get',
})

indexbd56c31c252751f65cdc675a47d13916.definition = {
    methods: ["get","head"],
    url: '/api/admin/gallery',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
indexbd56c31c252751f65cdc675a47d13916.url = (options?: RouteQueryOptions) => {
    return indexbd56c31c252751f65cdc675a47d13916.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
indexbd56c31c252751f65cdc675a47d13916.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexbd56c31c252751f65cdc675a47d13916.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
indexbd56c31c252751f65cdc675a47d13916.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexbd56c31c252751f65cdc675a47d13916.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
    const indexbd56c31c252751f65cdc675a47d13916Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexbd56c31c252751f65cdc675a47d13916.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
        indexbd56c31c252751f65cdc675a47d13916Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexbd56c31c252751f65cdc675a47d13916.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\GalleryController::index
 * @see app/Http/Controllers/Api/GalleryController.php:12
 * @route '/api/admin/gallery'
 */
        indexbd56c31c252751f65cdc675a47d13916Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexbd56c31c252751f65cdc675a47d13916.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexbd56c31c252751f65cdc675a47d13916.form = indexbd56c31c252751f65cdc675a47d13916Form

export const index = {
    '/api/gallery': index63ffdcb22e380c6a2b7ba47de5eb4449,
    '/api/admin/gallery': indexbd56c31c252751f65cdc675a47d13916,
}

/**
* @see \App\Http\Controllers\Api\GalleryController::store
 * @see app/Http/Controllers/Api/GalleryController.php:17
 * @route '/api/admin/gallery'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/admin/gallery',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\GalleryController::store
 * @see app/Http/Controllers/Api/GalleryController.php:17
 * @route '/api/admin/gallery'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GalleryController::store
 * @see app/Http/Controllers/Api/GalleryController.php:17
 * @route '/api/admin/gallery'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\GalleryController::store
 * @see app/Http/Controllers/Api/GalleryController.php:17
 * @route '/api/admin/gallery'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\GalleryController::store
 * @see app/Http/Controllers/Api/GalleryController.php:17
 * @route '/api/admin/gallery'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\GalleryController::update
 * @see app/Http/Controllers/Api/GalleryController.php:41
 * @route '/api/admin/gallery/{galleryImage}'
 */
export const update = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/admin/gallery/{galleryImage}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\GalleryController::update
 * @see app/Http/Controllers/Api/GalleryController.php:41
 * @route '/api/admin/gallery/{galleryImage}'
 */
update.url = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { galleryImage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { galleryImage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    galleryImage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        galleryImage: typeof args.galleryImage === 'object'
                ? args.galleryImage.id
                : args.galleryImage,
                }

    return update.definition.url
            .replace('{galleryImage}', parsedArgs.galleryImage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GalleryController::update
 * @see app/Http/Controllers/Api/GalleryController.php:41
 * @route '/api/admin/gallery/{galleryImage}'
 */
update.put = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\GalleryController::update
 * @see app/Http/Controllers/Api/GalleryController.php:41
 * @route '/api/admin/gallery/{galleryImage}'
 */
    const updateForm = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\GalleryController::update
 * @see app/Http/Controllers/Api/GalleryController.php:41
 * @route '/api/admin/gallery/{galleryImage}'
 */
        updateForm.put = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Api\GalleryController::destroy
 * @see app/Http/Controllers/Api/GalleryController.php:65
 * @route '/api/admin/gallery/{galleryImage}'
 */
export const destroy = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/admin/gallery/{galleryImage}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\GalleryController::destroy
 * @see app/Http/Controllers/Api/GalleryController.php:65
 * @route '/api/admin/gallery/{galleryImage}'
 */
destroy.url = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { galleryImage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { galleryImage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    galleryImage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        galleryImage: typeof args.galleryImage === 'object'
                ? args.galleryImage.id
                : args.galleryImage,
                }

    return destroy.definition.url
            .replace('{galleryImage}', parsedArgs.galleryImage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GalleryController::destroy
 * @see app/Http/Controllers/Api/GalleryController.php:65
 * @route '/api/admin/gallery/{galleryImage}'
 */
destroy.delete = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\GalleryController::destroy
 * @see app/Http/Controllers/Api/GalleryController.php:65
 * @route '/api/admin/gallery/{galleryImage}'
 */
    const destroyForm = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\GalleryController::destroy
 * @see app/Http/Controllers/Api/GalleryController.php:65
 * @route '/api/admin/gallery/{galleryImage}'
 */
        destroyForm.delete = (args: { galleryImage: number | { id: number } } | [galleryImage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const GalleryController = { index, store, update, destroy }

export default GalleryController