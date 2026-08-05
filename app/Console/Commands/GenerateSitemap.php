<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Sitemap\SitemapGenerator;

class GenerateSitemap extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate sitemap.xml in the public directory';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = public_path('sitemap.xml');

        SitemapGenerator::create(config('app.url'))
            ->writeToFile($path);

        $this->info('Sitemap generated successfully!');
    }
}
