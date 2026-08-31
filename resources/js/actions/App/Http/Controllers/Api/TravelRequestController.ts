import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TravelRequestController::store
 * @see app/Http/Controllers/Api/TravelRequestController.php:13
 * @route '/api/travel-request'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/travel-request',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TravelRequestController::store
 * @see app/Http/Controllers/Api/TravelRequestController.php:13
 * @route '/api/travel-request'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TravelRequestController::store
 * @see app/Http/Controllers/Api/TravelRequestController.php:13
 * @route '/api/travel-request'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\TravelRequestController::store
 * @see app/Http/Controllers/Api/TravelRequestController.php:13
 * @route '/api/travel-request'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\TravelRequestController::store
 * @see app/Http/Controllers/Api/TravelRequestController.php:13
 * @route '/api/travel-request'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const TravelRequestController = { store }

export default TravelRequestController