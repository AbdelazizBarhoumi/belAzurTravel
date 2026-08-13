import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\HotelSearchController::store
 * @see app/Http/Controllers/Api/HotelSearchController.php:17
 * @route '/api/hotels/search'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/hotels/search',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\HotelSearchController::store
 * @see app/Http/Controllers/Api/HotelSearchController.php:17
 * @route '/api/hotels/search'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\HotelSearchController::store
 * @see app/Http/Controllers/Api/HotelSearchController.php:17
 * @route '/api/hotels/search'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\HotelSearchController::store
 * @see app/Http/Controllers/Api/HotelSearchController.php:17
 * @route '/api/hotels/search'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\HotelSearchController::store
 * @see app/Http/Controllers/Api/HotelSearchController.php:17
 * @route '/api/hotels/search'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const HotelSearchController = { store }

export default HotelSearchController