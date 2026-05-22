import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\InteractionController::notify
 * @see app/Http/Controllers/Api/InteractionController.php:13
 * @route '/api/interactions/notify'
 */
export const notify = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: notify.url(options),
    method: 'post',
})

notify.definition = {
    methods: ["post"],
    url: '/api/interactions/notify',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\InteractionController::notify
 * @see app/Http/Controllers/Api/InteractionController.php:13
 * @route '/api/interactions/notify'
 */
notify.url = (options?: RouteQueryOptions) => {
    return notify.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\InteractionController::notify
 * @see app/Http/Controllers/Api/InteractionController.php:13
 * @route '/api/interactions/notify'
 */
notify.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: notify.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\InteractionController::notify
 * @see app/Http/Controllers/Api/InteractionController.php:13
 * @route '/api/interactions/notify'
 */
    const notifyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: notify.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\InteractionController::notify
 * @see app/Http/Controllers/Api/InteractionController.php:13
 * @route '/api/interactions/notify'
 */
        notifyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: notify.url(options),
            method: 'post',
        })
    
    notify.form = notifyForm
const InteractionController = { notify }

export default InteractionController