import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/partners',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\PartnerController::index
 * @see app/Http/Controllers/Api/PartnerController.php:13
 * @route '/api/partners'
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
const PartnerController = { index }

export default PartnerController