import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/auth/user',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AuthUserController::show
 * @see app/Http/Controllers/Api/AuthUserController.php:11
 * @route '/api/auth/user'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const AuthUserController = { show }

export default AuthUserController