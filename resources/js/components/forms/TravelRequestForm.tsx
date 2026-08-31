import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiFetch } from '@/api/http';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

export function TravelRequestForm() {
    const { t, dir } = useLanguage();
    const [submitting, setSubmitting] = useState(false);

    const formSchema = z.object({
        committeeName: z.string().min(2, {
            message: t('common.required') || 'Required',
        }),
        memberCount: z.string().min(1, {
            message: t('common.required') || 'Required',
        }),
        civility: z.string().min(1, {
            message: t('common.required') || 'Required',
        }),
        lastName: z.string().min(2, {
            message: t('common.required') || 'Required',
        }),
        firstName: z.string().min(2, {
            message: t('common.required') || 'Required',
        }),
        phone: z.string().min(8, {
            message: t('common.required') || 'Required',
        }),
        email: z.string().email({
            message: t('common.invalidEmail') || 'Invalid email',
        }),
        message: z.string().min(10, {
            message: t('common.required') || 'Required',
        }),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            committeeName: '',
            memberCount: '',
            civility: '',
            lastName: '',
            firstName: '',
            phone: '',
            email: '',
            message: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            await apiFetch('/api/travel-request', {
                method: 'POST',
                body: JSON.stringify(values),
            });
            toast.success(t('travels.submitSuccess'));
            form.reset();
        } catch {
            toast.error(t('travels.submitError'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                dir={dir}
            >
                <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="committeeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('travels.committeeName')}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t(
                                                'travels.committeeName',
                                            )}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="memberCount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('travels.memberCount')}
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={t(
                                                        'travels.memberCount',
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="5">
                                                5
                                            </SelectItem>
                                            <SelectItem value="10">
                                                10
                                            </SelectItem>
                                            <SelectItem value="15">
                                                15
                                            </SelectItem>
                                            <SelectItem value="20">
                                                20
                                            </SelectItem>
                                            <SelectItem value="30">
                                                30
                                            </SelectItem>
                                            <SelectItem value="50">
                                                50
                                            </SelectItem>
                                            <SelectItem value="100+">
                                                100+
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="civility"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('travels.civility')}
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            'travels.civility',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Mr">
                                                    Mr
                                                </SelectItem>
                                                <SelectItem value="Mme">
                                                    Mme
                                                </SelectItem>
                                                <SelectItem value="Mlle">
                                                    Mlle
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('travels.lastName')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    'travels.lastName',
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('travels.firstName')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    'travels.firstName',
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('travels.phone')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder={t(
                                                    'travels.phone',
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('travels.email')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder={t(
                                                    'travels.email',
                                                )}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('travels.message')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                'travels.messagePlaceholder',
                                            )}
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="rounded-full px-8"
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {t('travels.submitButton')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}
