import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\VisaApplicationController::store
 * @see app/Http/Controllers/Api/VisaApplicationController.php:12
 * @route '/api/visa-applications'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/visa-applications',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\VisaApplicationController::store
 * @see app/Http/Controllers/Api/VisaApplicationController.php:12
 * @route '/api/visa-applications'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VisaApplicationController::store
 * @see app/Http/Controllers/Api/VisaApplicationController.php:12
 * @route '/api/visa-applications'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\VisaApplicationController::store
 * @see app/Http/Controllers/Api/VisaApplicationController.php:12
 * @route '/api/visa-applications'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\VisaApplicationController::store
 * @see app/Http/Controllers/Api/VisaApplicationController.php:12
 * @route '/api/visa-applications'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const VisaApplicationController = { store }

export default VisaApplicationController