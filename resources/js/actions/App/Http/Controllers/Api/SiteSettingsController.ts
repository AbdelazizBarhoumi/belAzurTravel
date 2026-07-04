import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/site-settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\SiteSettingsController::show
 * @see app/Http/Controllers/Api/SiteSettingsController.php:20
 * @route '/api/site-settings'
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
/**
* @see \App\Http\Controllers\Api\SiteSettingsController::update
 * @see app/Http/Controllers/Api/SiteSettingsController.php:233
 * @route '/api/site-settings'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/site-settings',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\SiteSettingsController::update
 * @see app/Http/Controllers/Api/SiteSettingsController.php:233
 * @route '/api/site-settings'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SiteSettingsController::update
 * @see app/Http/Controllers/Api/SiteSettingsController.php:233
 * @route '/api/site-settings'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\SiteSettingsController::update
 * @see app/Http/Controllers/Api/SiteSettingsController.php:233
 * @route '/api/site-settings'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\SiteSettingsController::update
 * @see app/Http/Controllers/Api/SiteSettingsController.php:233
 * @route '/api/site-settings'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const SiteSettingsController = { show, update }

export default SiteSettingsController