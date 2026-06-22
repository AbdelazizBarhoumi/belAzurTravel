import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PaymentController::initiate
 * @see app/Http/Controllers/Api/PaymentController.php:26
 * @route '/api/bookings/{id}/pay'
 */
export const initiate = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: initiate.url(args, options),
    method: 'post',
})

initiate.definition = {
    methods: ["post"],
    url: '/api/bookings/{id}/pay',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PaymentController::initiate
 * @see app/Http/Controllers/Api/PaymentController.php:26
 * @route '/api/bookings/{id}/pay'
 */
initiate.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return initiate.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PaymentController::initiate
 * @see app/Http/Controllers/Api/PaymentController.php:26
 * @route '/api/bookings/{id}/pay'
 */
initiate.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: initiate.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PaymentController::initiate
 * @see app/Http/Controllers/Api/PaymentController.php:26
 * @route '/api/bookings/{id}/pay'
 */
    const initiateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: initiate.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PaymentController::initiate
 * @see app/Http/Controllers/Api/PaymentController.php:26
 * @route '/api/bookings/{id}/pay'
 */
        initiateForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: initiate.url(args, options),
            method: 'post',
        })
    
    initiate.form = initiateForm
/**
* @see \App\Http\Controllers\Api\PaymentController::retry
 * @see app/Http/Controllers/Api/PaymentController.php:171
 * @route '/api/bookings/{id}/retry-payment'
 */
export const retry = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retry.url(args, options),
    method: 'post',
})

retry.definition = {
    methods: ["post"],
    url: '/api/bookings/{id}/retry-payment',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PaymentController::retry
 * @see app/Http/Controllers/Api/PaymentController.php:171
 * @route '/api/bookings/{id}/retry-payment'
 */
retry.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return retry.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PaymentController::retry
 * @see app/Http/Controllers/Api/PaymentController.php:171
 * @route '/api/bookings/{id}/retry-payment'
 */
retry.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retry.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\PaymentController::retry
 * @see app/Http/Controllers/Api/PaymentController.php:171
 * @route '/api/bookings/{id}/retry-payment'
 */
    const retryForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: retry.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\PaymentController::retry
 * @see app/Http/Controllers/Api/PaymentController.php:171
 * @route '/api/bookings/{id}/retry-payment'
 */
        retryForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: retry.url(args, options),
            method: 'post',
        })
    
    retry.form = retryForm
/**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/api/payment/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
    const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: callback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
        callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\PaymentController::callback
 * @see app/Http/Controllers/Api/PaymentController.php:70
 * @route '/api/payment/callback'
 */
        callbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    callback.form = callbackForm
const PaymentController = { initiate, retry, callback }

export default PaymentController