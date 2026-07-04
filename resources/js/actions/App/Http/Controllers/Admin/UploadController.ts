import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\UploadController::store
 * @see app/Http/Controllers/Admin/UploadController.php:11
 * @route '/api/admin/upload'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/admin/upload',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\UploadController::store
 * @see app/Http/Controllers/Admin/UploadController.php:11
 * @route '/api/admin/upload'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\UploadController::store
 * @see app/Http/Controllers/Admin/UploadController.php:11
 * @route '/api/admin/upload'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\UploadController::store
 * @see app/Http/Controllers/Admin/UploadController.php:11
 * @route '/api/admin/upload'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\UploadController::store
 * @see app/Http/Controllers/Admin/UploadController.php:11
 * @route '/api/admin/upload'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const UploadController = { store }

export default UploadController