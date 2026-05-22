import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/team',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\TeamController::index
 * @see app/Http/Controllers/Api/TeamController.php:17
 * @route '/api/team'
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
const TeamController = { index }

export default TeamController