<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

class ImportSql extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-sql {--file= : Specific SQL file to import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import the latest SQL dump from the data directory into the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dataDir = base_path('data');
        $specificFile = $this->option('file');

        if (!File::isDirectory($dataDir)) {
            $this->error("Data directory not found at: {$dataDir}");
            return 1;
        }

        $fileToImport = null;

        if ($specificFile) {
            $fileToImport = $dataDir . DIRECTORY_SEPARATOR . $specificFile;
            if (!File::exists($fileToImport)) {
                $this->error("Specific file not found: {$fileToImport}");
                return 1;
            }
        } else {
            // Find latest .sql file
            $files = File::glob($dataDir . '/*.sql');
            
            if (empty($files)) {
                $this->warn("No .sql files found in {$dataDir}");
                return 0;
            }

            // Sort by modified time descending
            usort($files, function($a, $b) {
                return File::lastModified($b) <=> File::lastModified($a);
            });

            $fileToImport = $files[0];
        }

        $this->info("Found SQL file to import: " . basename($fileToImport));

        // Get DB config
        $config = config('database.connections.mysql');
        
        if (!$config) {
            $this->error("MySQL database configuration not found.");
            return 1;
        }

        $host = $config['host'];
        $port = $config['port'];
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        $this->info("Importing into database: {$database} on {$host}:{$port}...");

        // Construct mysql command
        // Note: Using -pPASSWORD directly causes a warning but is common in scripts
        // Using --host=host.docker.internal works if configured in docker
        $command = sprintf(
            'mysql --host=%s --port=%s --user=%s --password=%s %s < %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($fileToImport)
        );

        // Run the command
        $process = Process::fromShellCommandline($command);
        $process->setTimeout(null); // No timeout for large imports

        $this->info("Running: mysql ... < " . basename($fileToImport));
        
        $process->run(function ($type, $buffer) {
            $this->output->write($buffer);
        });

        if (!$process->isSuccessful()) {
            $this->error("Import failed!");
            $this->error($process->getErrorOutput());
            return 1;
        }

        $this->info("Database import completed successfully.");
        return 0;
    }
}
