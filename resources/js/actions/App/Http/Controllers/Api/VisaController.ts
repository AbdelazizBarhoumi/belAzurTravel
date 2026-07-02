import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/visas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\VisaController::index
 * @see app/Http/Controllers/Api/VisaController.php:13
 * @route '/api/visas'
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
const VisaController = { index }

export default VisaController