import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/admin/support-inquiries',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::index
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:17
 * @route '/api/admin/support-inquiries'
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
/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::update
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:28
 * @route '/api/admin/support-inquiries/{inquiry}'
 */
export const update = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/admin/support-inquiries/{inquiry}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::update
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:28
 * @route '/api/admin/support-inquiries/{inquiry}'
 */
update.url = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { inquiry: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { inquiry: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    inquiry: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        inquiry: typeof args.inquiry === 'object'
                ? args.inquiry.id
                : args.inquiry,
                }

    return update.definition.url
            .replace('{inquiry}', parsedArgs.inquiry.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::update
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:28
 * @route '/api/admin/support-inquiries/{inquiry}'
 */
update.put = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::update
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:28
 * @route '/api/admin/support-inquiries/{inquiry}'
 */
    const updateForm = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::update
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:28
 * @route '/api/admin/support-inquiries/{inquiry}'
 */
        updateForm.put = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::reply
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:44
 * @route '/api/admin/support-inquiries/{inquiry}/reply'
 */
export const reply = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reply.url(args, options),
    method: 'post',
})

reply.definition = {
    methods: ["post"],
    url: '/api/admin/support-inquiries/{inquiry}/reply',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::reply
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:44
 * @route '/api/admin/support-inquiries/{inquiry}/reply'
 */
reply.url = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { inquiry: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { inquiry: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    inquiry: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        inquiry: typeof args.inquiry === 'object'
                ? args.inquiry.id
                : args.inquiry,
                }

    return reply.definition.url
            .replace('{inquiry}', parsedArgs.inquiry.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::reply
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:44
 * @route '/api/admin/support-inquiries/{inquiry}/reply'
 */
reply.post = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reply.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::reply
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:44
 * @route '/api/admin/support-inquiries/{inquiry}/reply'
 */
    const replyForm = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reply.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminSupportInquiryController::reply
 * @see app/Http/Controllers/Api/AdminSupportInquiryController.php:44
 * @route '/api/admin/support-inquiries/{inquiry}/reply'
 */
        replyForm.post = (args: { inquiry: number | { id: number } } | [inquiry: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reply.url(args, options),
            method: 'post',
        })
    
    reply.form = replyForm
const AdminSupportInquiryController = { index, update, reply }

export default AdminSupportInquiryController