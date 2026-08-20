import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/admin/queue',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminQueueController::index
 * @see app/Http/Controllers/Api/AdminQueueController.php:26
 * @route '/api/admin/queue'
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
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
export const counts = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: counts.url(options),
    method: 'get',
})

counts.definition = {
    methods: ["get","head"],
    url: '/api/admin/queue/counts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
counts.url = (options?: RouteQueryOptions) => {
    return counts.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
counts.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: counts.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
counts.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: counts.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
    const countsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: counts.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
        countsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: counts.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminQueueController::counts
 * @see app/Http/Controllers/Api/AdminQueueController.php:21
 * @route '/api/admin/queue/counts'
 */
        countsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: counts.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    counts.form = countsForm
const AdminQueueController = { index, counts }

export default AdminQueueController