import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/client/complaints',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ComplaintController::index
 * @see app/Http/Controllers/Api/ComplaintController.php:16
 * @route '/api/client/complaints'
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
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/client/complaints/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ComplaintController::show
 * @see app/Http/Controllers/Api/ComplaintController.php:28
 * @route '/api/client/complaints/{id}'
 */
        showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Api\ComplaintController::store
 * @see app/Http/Controllers/Api/ComplaintController.php:37
 * @route '/api/client/complaints'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/client/complaints',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ComplaintController::store
 * @see app/Http/Controllers/Api/ComplaintController.php:37
 * @route '/api/client/complaints'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ComplaintController::store
 * @see app/Http/Controllers/Api/ComplaintController.php:37
 * @route '/api/client/complaints'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ComplaintController::store
 * @see app/Http/Controllers/Api/ComplaintController.php:37
 * @route '/api/client/complaints'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ComplaintController::store
 * @see app/Http/Controllers/Api/ComplaintController.php:37
 * @route '/api/client/complaints'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\ComplaintController::reply
 * @see app/Http/Controllers/Api/ComplaintController.php:81
 * @route '/api/client/complaints/{id}/reply'
 */
export const reply = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reply.url(args, options),
    method: 'post',
})

reply.definition = {
    methods: ["post"],
    url: '/api/client/complaints/{id}/reply',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ComplaintController::reply
 * @see app/Http/Controllers/Api/ComplaintController.php:81
 * @route '/api/client/complaints/{id}/reply'
 */
reply.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return reply.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ComplaintController::reply
 * @see app/Http/Controllers/Api/ComplaintController.php:81
 * @route '/api/client/complaints/{id}/reply'
 */
reply.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reply.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ComplaintController::reply
 * @see app/Http/Controllers/Api/ComplaintController.php:81
 * @route '/api/client/complaints/{id}/reply'
 */
    const replyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reply.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ComplaintController::reply
 * @see app/Http/Controllers/Api/ComplaintController.php:81
 * @route '/api/client/complaints/{id}/reply'
 */
        replyForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reply.url(args, options),
            method: 'post',
        })
    
    reply.form = replyForm
const ComplaintController = { index, show, store, reply }

export default ComplaintController