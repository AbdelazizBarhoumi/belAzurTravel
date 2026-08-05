<?php
session_start();

// ─── CONFIG ───────────────────────────────────────────────────────────────────
define('ROOT', realpath(__DIR__));
define('VERSION', '2.0');

$message = ['type' => '', 'text' => ''];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function safePath($rel)
{
    $abs = realpath(ROOT.'/'.ltrim($rel, '/'));
    if ($abs && strpos($abs, ROOT) === 0) {
        return $abs;
    }
    // For new files that don't exist yet
    $abs2 = ROOT.'/'.ltrim($rel, '/');
    if (strpos(realpath(dirname($abs2)), ROOT) === 0) {
        return $abs2;
    }

    return false;
}

function formatSize($bytes)
{
    if ($bytes === false || $bytes < 0) {
        return '-';
    }
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $i = 0;
    while ($bytes >= 1024 && $i < 4) {
        $bytes /= 1024;
        $i++;
    }

    return round($bytes, 1).' '.$units[$i];
}

function formatPerms($path)
{
    $perms = fileperms($path);
    $info = '';
    $info .= (($perms & 0x0100) ? 'r' : '-');
    $info .= (($perms & 0x0080) ? 'w' : '-');
    $info .= (($perms & 0x0040) ? 'x' : '-');
    $info .= (($perms & 0x0020) ? 'r' : '-');
    $info .= (($perms & 0x0010) ? 'w' : '-');
    $info .= (($perms & 0x0008) ? 'x' : '-');
    $info .= (($perms & 0x0004) ? 'r' : '-');
    $info .= (($perms & 0x0002) ? 'w' : '-');
    $info .= (($perms & 0x0001) ? 'x' : '-');

    return $info;
}

function isText($path)
{
    $textExts = ['txt', 'php', 'html', 'htm', 'css', 'js', 'json', 'xml', 'csv', 'md', 'log', 'ini', 'env', 'sh', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'ts', 'jsx', 'tsx', 'vue', 'yaml', 'yml', 'conf', 'htaccess', 'gitignore', 'sql'];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    return in_array($ext, $textExts);
}

function isImage($path)
{
    $imgExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    return in_array($ext, $imgExts);
}

function deleteRecursive($path)
{
    if (is_file($path) || is_link($path)) {
        return unlink($path);
    }
    if (! is_dir($path)) {
        return false;
    }
    foreach (array_diff(scandir($path), ['.', '..']) as $item) {
        deleteRecursive($path.DIRECTORY_SEPARATOR.$item);
    }

    return rmdir($path);
}

function copyRecursive($src, $dst)
{
    if (is_dir($src)) {
        @mkdir($dst, 0755, true);
        foreach (array_diff(scandir($src), ['.', '..']) as $item) {
            copyRecursive($src.'/'.$item, $dst.'/'.$item);
        }
    } else {
        copy($src, $dst);
    }
}

function getDirSize($path)
{
    $size = 0;
    if (! is_dir($path)) {
        return filesize($path);
    }
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $f) {
        $size += $f->getSize();
    }

    return $size;
}

function searchFiles($dir, $query)
{
    $results = [];
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if (stripos($file->getFilename(), $query) !== false) {
            $results[] = $file->getPathname();
        }
        if (count($results) >= 200) {
            break;
        }
    }

    return $results;
}

// ─── CURRENT DIRECTORY ────────────────────────────────────────────────────────
$cwd = ROOT;
if (isset($_GET['dir'])) {
    $cd = safePath($_GET['dir']);
    if ($cd && is_dir($cd)) {
        $cwd = $cd;
    }
}
$cwdRel = str_replace(ROOT, '', $cwd) ?: '/';

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

// Upload (files and folders)
if (isset($_FILES['upload_files']) && ! empty($_FILES['upload_files']['name'][0])) {
    $uploaded = 0;
    $failed = 0;
    $dirsMade = [];
    $relativePaths = $_POST['relative_paths'] ?? [];

    foreach ($_FILES['upload_files']['name'] as $i => $name) {
        if ($_FILES['upload_files']['error'][$i] !== UPLOAD_ERR_OK) {
            $failed++;

            continue;
        }

        $relPath = $relativePaths[$i] ?? '';

        if ($relPath !== '') {
            // Sanitise: strip traversal segments and normalise slashes
            $safeParts = [];
            foreach (explode('/', str_replace('\\', '/', $relPath)) as $part) {
                if ($part === '' || $part === '.' || $part === '..') {
                    continue;
                }
                $safeParts[] = $part;
            }
            if (empty($safeParts)) {
                $dest = $cwd.'/'.basename($name);
            } else {
                $dest = $cwd.'/'.implode('/', $safeParts);
                $destDir = dirname($dest);
                // Create parent dirs and verify they stay within $cwd
                if (! isset($dirsMade[$destDir])) {
                    @mkdir($destDir, 0755, true);
                    $dirsMade[$destDir] = true;
                }
                $resolved = realpath($destDir);
                if (! $resolved || strpos($resolved, $cwd) !== 0) {
                    $failed++;

                    continue;
                }
            }
        } else {
            $dest = $cwd.'/'.basename($name);
        }

        if (move_uploaded_file($_FILES['upload_files']['tmp_name'][$i], $dest)) {
            $uploaded++;
        } else {
            $failed++;
        }
    }

    $folderMsg = count($dirsMade) ? ' in '.count($dirsMade).' folder(s)' : '';
    $message = ['type' => 'success', 'text' => "Uploaded $uploaded file(s)$folderMsg.".($failed ? " $failed failed." : '')];
}

// Create folder
if (isset($_POST['action']) && $_POST['action'] === 'mkdir') {
    $name = basename(trim($_POST['name'] ?? ''));
    if ($name) {
        $path = $cwd.'/'.$name;
        $message = mkdir($path, 0755)
            ? ['type' => 'success', 'text' => "Folder '$name' created."]
            : ['type' => 'error', 'text' => 'Failed to create folder.'];
    }
}

// Create file
if (isset($_POST['action']) && $_POST['action'] === 'mkfile') {
    $name = basename(trim($_POST['name'] ?? ''));
    if ($name) {
        $path = $cwd.'/'.$name;
        $message = (file_put_contents($path, '') !== false)
            ? ['type' => 'success', 'text' => "File '$name' created."]
            : ['type' => 'error', 'text' => 'Failed to create file.'];
    }
}

// Delete
if (isset($_POST['action']) && $_POST['action'] === 'delete') {
    $targets = $_POST['targets'] ?? [];
    $count = 0;
    foreach ($targets as $t) {
        $p = safePath($cwdRel.'/'.basename($t));
        if ($p && deleteRecursive($p)) {
            $count++;
        }
    }
    $message = ['type' => 'success', 'text' => "Deleted $count item(s)."];
}

// Rename
if (isset($_POST['action']) && $_POST['action'] === 'rename') {
    $old = safePath($cwdRel.'/'.basename($_POST['old_name'] ?? ''));
    $new = $cwd.'/'.basename($_POST['new_name'] ?? '');
    if ($old && file_exists($old) && ! file_exists($new)) {
        $message = rename($old, $new)
            ? ['type' => 'success', 'text' => 'Renamed successfully.']
            : ['type' => 'error', 'text' => 'Rename failed.'];
    } else {
        $message = ['type' => 'error', 'text' => 'Invalid rename operation.'];
    }
}

// Copy
if (isset($_POST['action']) && $_POST['action'] === 'copy') {
    $src = safePath($cwdRel.'/'.basename($_POST['src'] ?? ''));
    $dstName = basename($_POST['dst_name'] ?? '');
    if ($src && $dstName) {
        $dst = $cwd.'/'.$dstName;
        copyRecursive($src, $dst);
        $message = ['type' => 'success', 'text' => "Copied to '$dstName'."];
    }
}

// Move
if (isset($_POST['action']) && $_POST['action'] === 'move') {
    $src = safePath($cwdRel.'/'.basename($_POST['src'] ?? ''));
    $dstDir = safePath($_POST['dst_dir'] ?? '/');
    if ($src && $dstDir && is_dir($dstDir)) {
        $dst = $dstDir.'/'.basename($src);
        $message = rename($src, $dst)
            ? ['type' => 'success', 'text' => 'Moved successfully.']
            : ['type' => 'error', 'text' => 'Move failed.'];
    }
}

// Save file
if (isset($_POST['action']) && $_POST['action'] === 'save') {
    $p = safePath($_POST['filepath'] ?? '');
    if ($p && is_file($p)) {
        $message = (file_put_contents($p, $_POST['content'] ?? '') !== false)
            ? ['type' => 'success', 'text' => 'File saved.']
            : ['type' => 'error', 'text' => 'Save failed.'];
    }
}

// Permissions
if (isset($_POST['action']) && $_POST['action'] === 'chmod') {
    $p = safePath($cwdRel.'/'.basename($_POST['target'] ?? ''));
    $mode = octdec(trim($_POST['mode'] ?? ''));
    if ($p && $mode) {
        $message = chmod($p, $mode)
            ? ['type' => 'success', 'text' => 'Permissions updated.']
            : ['type' => 'error', 'text' => 'chmod failed.'];
    }
}

// Zip
if (isset($_POST['action']) && $_POST['action'] === 'zip') {
    $targets = $_POST['targets'] ?? [];
    $zipName = basename(trim($_POST['zip_name'] ?? 'archive')).'.zip';
    $zipPath = $cwd.'/'.$zipName;
    $zip = new ZipArchive;
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
        foreach ($targets as $t) {
            $p = safePath($cwdRel.'/'.basename($t));
            if (! $p) {
                continue;
            }
            if (is_file($p)) {
                $zip->addFile($p, basename($p));
            } elseif (is_dir($p)) {
                $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($p, FilesystemIterator::SKIP_DOTS));
                foreach ($it as $f) {
                    $zip->addFile($f->getPathname(), basename($p).'/'.$it->getSubPathname());
                }
            }
        }
        $zip->close();
        $message = ['type' => 'success', 'text' => "Archive '$zipName' created."];
    } else {
        $message = ['type' => 'error', 'text' => 'Failed to create archive.'];
    }
}

// Unzip
if (isset($_POST['action']) && $_POST['action'] === 'unzip') {
    $p = safePath($cwdRel.'/'.basename($_POST['target'] ?? ''));
    if ($p && is_file($p)) {
        $zip = new ZipArchive;
        if ($zip->open($p) === true) {
            $extractDir = $cwd.'/'.pathinfo($p, PATHINFO_FILENAME);
            @mkdir($extractDir, 0755, true);
            $zip->extractTo($extractDir);
            $zip->close();
            $message = ['type' => 'success', 'text' => "Extracted to '".basename($extractDir)."'."];
        }
    }
}

// Download repo
if (isset($_POST['action']) && $_POST['action'] === 'download_repo') {
    $repoZip = trim($_POST['repo_url'] ?? '');
    if ($repoZip) {
        $zipFile = $cwd.'/_repo_tmp.zip';
        $data = @file_get_contents($repoZip);
        if ($data !== false) {
            file_put_contents($zipFile, $data);
            $zip = new ZipArchive;
            if ($zip->open($zipFile) === true) {
                $tempDir = $cwd.'/_tmp_extract_'.time();
                mkdir($tempDir, 0777, true);
                $zip->extractTo($tempDir);
                $zip->close();
                $folders = glob($tempDir.'/*', GLOB_ONLYDIR);
                if (! empty($folders)) {
                    foreach (scandir($folders[0]) as $f) {
                        if ($f === '.' || $f === '..') {
                            continue;
                        }
                        rename($folders[0].'/'.$f, $cwd.'/'.$f);
                    }
                    deleteRecursive($tempDir);
                }
                @unlink($zipFile);
                $message = ['type' => 'success', 'text' => 'Repository downloaded and extracted.'];
            } else {
                $message = ['type' => 'error', 'text' => 'Failed to open ZIP.'];
            }
        } else {
            $message = ['type' => 'error', 'text' => 'Failed to download ZIP.'];
        }
    }
}

// Download file (force download)
if (isset($_GET['download_file'])) {
    $p = safePath($_GET['download_file']);
    if ($p && is_file($p)) {
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="'.basename($p).'"');
        header('Content-Length: '.filesize($p));
        readfile($p);
        exit;
    }
}

// Preview / serve image
if (isset($_GET['preview'])) {
    $p = safePath($_GET['preview']);
    if ($p && is_file($p) && isImage($p)) {
        $mime = mime_content_type($p) ?: 'image/jpeg';
        header('Content-Type: '.$mime);
        readfile($p);
        exit;
    }
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
$searchResults = null;
if (isset($_GET['search']) && trim($_GET['search']) !== '') {
    $searchResults = searchFiles(ROOT, trim($_GET['search']));
}

// ─── EDIT FILE ────────────────────────────────────────────────────────────────
$editFile = null;
$editContent = '';
if (isset($_GET['edit'])) {
    $p = safePath($_GET['edit']);
    if ($p && is_file($p) && isText($p)) {
        $editFile = $p;
        $editContent = file_get_contents($p);
    }
}

// ─── FILE LIST ────────────────────────────────────────────────────────────────
$items = [];
if (! $searchResults && ! $editFile) {
    $raw = @scandir($cwd);
    if ($raw) {
        foreach ($raw as $name) {
            if ($name === '.' || $name === '..') {
                continue;
            }
            $full = $cwd.'/'.$name;
            $items[] = [
                'name' => $name,
                'full' => $full,
                'rel' => str_replace(ROOT, '', $full),
                'isDir' => is_dir($full),
                'size' => is_file($full) ? filesize($full) : getDirSize($full),
                'mtime' => filemtime($full),
                'perms' => formatPerms($full),
            ];
        }
        usort($items, fn ($a, $b) => ($b['isDir'] - $a['isDir']) ?: strnatcasecmp($a['name'], $b['name']));
    }
}

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
$breadParts = array_filter(explode('/', $cwdRel));
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FileBridge — File Manager</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --bg:       #0a0b0f;
  --surface:  #111318;
  --panel:    #161920;
  --border:   #1e2230;
  --border2:  #252a38;
  --text:     #e2e6f0;
  --muted:    #6b7490;
  --accent:   #4f8fff;
  --accent2:  #7c5cff;
  --green:    #2de08d;
  --red:      #ff4d6a;
  --yellow:   #ffc34d;
  --folder:   #ffc34d;
  --file:     #7ec8ff;
  --radius:   8px;
  --mono:     'DM Mono', monospace;
  --sans:     'Syne', sans-serif;
  --trans:    all .18s cubic-bezier(.4,0,.2,1);
}
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html,body { height:100%; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height:1.5;
  min-height:100vh;
}

/* ─── LAYOUT ─────────────────────────────────────── */
.app { display:flex; flex-direction:column; height:100vh; }

.topbar {
  display:flex; align-items:center; gap:16px;
  padding: 0 20px;
  height: 54px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink:0;
}
.logo {
  font-size:17px; font-weight:800; letter-spacing:-.5px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  white-space:nowrap;
}
.topbar-search {
  flex:1; max-width:360px;
  display:flex; align-items:center;
  background: var(--panel);
  border:1px solid var(--border2);
  border-radius:6px;
  padding:0 10px;
  gap:8px;
}
.topbar-search input {
  background:none; border:none; outline:none;
  color:var(--text); font-family:var(--mono); font-size:13px;
  flex:1; padding:7px 0;
}
.topbar-search input::placeholder { color:var(--muted); }
.topbar-search svg { color:var(--muted); flex-shrink:0; }
.topbar-actions { display:flex; gap:8px; margin-left:auto; }

.main { display:flex; flex:1; overflow:hidden; }

.sidebar {
  width:220px; flex-shrink:0;
  background:var(--surface);
  border-right:1px solid var(--border);
  overflow-y:auto;
  padding:12px 0;
}
.sidebar-section { padding:4px 0; }
.sidebar-title {
  font-size:10px; font-weight:700; letter-spacing:.1em;
  color:var(--muted); text-transform:uppercase;
  padding:6px 16px;
}
.sidebar-item {
  display:flex; align-items:center; gap:10px;
  padding:7px 16px; cursor:pointer;
  color:var(--muted);
  transition:var(--trans);
  text-decoration:none;
  font-size:13px;
}
.sidebar-item:hover, .sidebar-item.active {
  background:var(--panel); color:var(--text);
}
.sidebar-item svg { flex-shrink:0; }

.content { flex:1; display:flex; flex-direction:column; overflow:hidden; }

.toolbar {
  display:flex; align-items:center; gap:8px;
  padding:10px 16px;
  background:var(--surface);
  border-bottom:1px solid var(--border);
  flex-wrap:wrap;
  flex-shrink:0;
}
.breadcrumb {
  display:flex; align-items:center; gap:4px;
  font-family:var(--mono); font-size:12px;
  color:var(--muted); flex:1; min-width:0;
  flex-wrap:wrap;
}
.breadcrumb a {
  color:var(--accent); text-decoration:none;
  transition:var(--trans);
}
.breadcrumb a:hover { color:#fff; }
.breadcrumb span { color:var(--muted); }
.breadcrumb .current { color:var(--text); }

.btn {
  display:inline-flex; align-items:center; gap:6px;
  padding:6px 12px; border-radius:5px; border:none;
  font-family:var(--sans); font-size:12px; font-weight:600;
  cursor:pointer; transition:var(--trans); white-space:nowrap;
  text-decoration:none;
}
.btn-primary { background:var(--accent); color:#fff; }
.btn-primary:hover { background:#3a74e0; }
.btn-ghost { background:var(--panel); color:var(--text); border:1px solid var(--border2); }
.btn-ghost:hover { background:var(--border2); }
.btn-danger { background:rgba(255,77,106,.15); color:var(--red); border:1px solid rgba(255,77,106,.3); }
.btn-danger:hover { background:rgba(255,77,106,.25); }
.btn-sm { padding:4px 8px; font-size:11px; }
.btn svg { pointer-events:none; }

.file-area { flex:1; overflow-y:auto; padding:16px; }

/* ─── FILE TABLE ─────────────────────────────────── */
.file-table {
  width:100%; border-collapse:collapse;
}
.file-table th {
  text-align:left; font-size:11px; font-weight:600;
  color:var(--muted); text-transform:uppercase; letter-spacing:.06em;
  padding:8px 12px; border-bottom:1px solid var(--border);
  background:var(--surface); position:sticky; top:0; z-index:2;
}
.file-table th:first-child { border-radius:6px 0 0 0; }
.file-table th:last-child  { border-radius:0 6px 0 0; }
.file-table td {
  padding:9px 12px; border-bottom:1px solid var(--border);
  vertical-align:middle;
}
.file-table tr { transition:background .12s; }
.file-table tr:hover td { background:var(--panel); }
.file-table tr.selected td { background:rgba(79,143,255,.08); }

.file-icon { display:flex; align-items:center; gap:10px; }
.file-icon .icon { font-size:16px; line-height:1; }
.file-name {
  color:var(--text); text-decoration:none; font-weight:500;
  transition:var(--trans);
}
.file-name:hover { color:var(--accent); }
.file-name.folder { color:var(--folder); }
.file-meta { font-family:var(--mono); font-size:12px; color:var(--muted); }
.file-perms { font-family:var(--mono); font-size:11px; color:var(--muted); }
.row-actions { display:flex; gap:4px; opacity:0; transition:var(--trans); }
tr:hover .row-actions { opacity:1; }

/* ─── MESSAGES ───────────────────────────────────── */
.toast {
  display:flex; align-items:center; gap:10px;
  padding:10px 16px; margin:0 16px 12px;
  border-radius:var(--radius); font-size:13px;
  animation: slideIn .25s ease;
}
.toast-success { background:rgba(45,224,141,.1); border:1px solid rgba(45,224,141,.3); color:var(--green); }
.toast-error   { background:rgba(255,77,106,.1);  border:1px solid rgba(255,77,106,.3);  color:var(--red); }
@keyframes slideIn { from{transform:translateY(-8px);opacity:0} to{transform:none;opacity:1} }

/* ─── MODALS ─────────────────────────────────────── */
.overlay {
  display:none; position:fixed; inset:0;
  background:rgba(0,0,0,.7); backdrop-filter:blur(4px);
  z-index:1000; align-items:center; justify-content:center;
}
.overlay.show { display:flex; }
.modal {
  background:var(--surface); border:1px solid var(--border2);
  border-radius:12px; padding:28px; min-width:340px; max-width:600px; width:90%;
  box-shadow: 0 32px 80px rgba(0,0,0,.6);
  animation: modalIn .2s ease;
}
@keyframes modalIn { from{transform:scale(.95);opacity:0} to{transform:none;opacity:1} }
.modal h3 {
  font-size:16px; font-weight:700; margin-bottom:18px;
  color:var(--text);
}
.modal-row { margin-bottom:14px; }
.modal label { display:block; font-size:12px; color:var(--muted); margin-bottom:6px; font-weight:600; }
.modal input, .modal select, .modal textarea {
  width:100%; background:var(--panel); border:1px solid var(--border2);
  border-radius:6px; color:var(--text); font-family:var(--mono); font-size:13px;
  padding:8px 10px; outline:none; transition:border-color .15s;
}
.modal input:focus, .modal select:focus, .modal textarea:focus {
  border-color:var(--accent);
}
.modal textarea { resize:vertical; min-height:80px; }
.modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }

/* ─── UPLOAD TABS ────────────────────────────────── */
.upload-tabs {
  display:flex; border:1px solid var(--border2);
  border-radius:7px; overflow:hidden; margin-bottom:16px;
}
.upload-tab {
  flex:1; padding:8px 12px; border:none; cursor:pointer;
  font-family:var(--sans); font-size:12px; font-weight:700;
  letter-spacing:.03em; transition:var(--trans);
  display:flex; align-items:center; justify-content:center; gap:6px;
}
.upload-tab.active { background:var(--accent); color:#fff; }
.upload-tab:not(.active) { background:var(--panel); color:var(--muted); }
.upload-tab:not(.active):hover { background:var(--border2); color:var(--text); }

/* ─── EDITOR ─────────────────────────────────────── */
.editor-wrap { height:100%; display:flex; flex-direction:column; }
.editor-bar {
  display:flex; align-items:center; gap:10px;
  padding:10px 16px; background:var(--surface);
  border-bottom:1px solid var(--border);
  flex-shrink:0;
}
.editor-bar .filename {
  font-family:var(--mono); font-size:13px; color:var(--accent); flex:1;
}
#editor-textarea {
  flex:1; background:var(--panel); border:none; outline:none;
  color:var(--text); font-family:var(--mono); font-size:13px;
  line-height:1.7; padding:20px;
  resize:none; tab-size:2;
}

/* ─── UPLOAD ZONE ────────────────────────────────── */
.upload-zone {
  border:2px dashed var(--border2); border-radius:var(--radius);
  padding:32px; text-align:center; cursor:pointer;
  transition:var(--trans); color:var(--muted);
}
.upload-zone:hover, .upload-zone.dragover {
  border-color:var(--accent); color:var(--text);
  background:rgba(79,143,255,.05);
}
.upload-zone .icon { font-size:32px; margin-bottom:8px; }
.upload-zone p { font-size:13px; }

/* ─── CHECKBOX ───────────────────────────────────── */
input[type=checkbox] {
  width:15px; height:15px; accent-color:var(--accent); cursor:pointer;
}

/* ─── INFO BAR ───────────────────────────────────── */
.infobar {
  display:flex; align-items:center; gap:16px;
  padding:6px 16px; font-size:11px; font-family:var(--mono);
  color:var(--muted); background:var(--surface);
  border-top:1px solid var(--border);
  flex-shrink:0;
}
.infobar span { display:flex; align-items:center; gap:5px; }

/* ─── CONTEXT MENU ───────────────────────────────── */
.ctx-menu {
  display:none; position:fixed; z-index:2000;
  background:var(--surface); border:1px solid var(--border2);
  border-radius:8px; min-width:180px;
  box-shadow: 0 12px 36px rgba(0,0,0,.5);
  padding:4px 0; font-size:13px;
}
.ctx-menu.show { display:block; }
.ctx-item {
  display:flex; align-items:center; gap:10px;
  padding:8px 16px; cursor:pointer; color:var(--text);
  transition:background .1s;
}
.ctx-item:hover { background:var(--panel); }
.ctx-item.danger { color:var(--red); }
.ctx-sep { height:1px; background:var(--border); margin:4px 0; }

/* ─── SCROLLBAR ──────────────────────────────────── */
::-webkit-scrollbar { width:5px; height:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border2); border-radius:99px; }
::-webkit-scrollbar-thumb:hover { background:var(--muted); }

/* ─── SEARCH RESULTS ─────────────────────────────── */
.search-result-item {
  display:flex; align-items:center; gap:10px;
  padding:9px 12px; border-bottom:1px solid var(--border);
  transition:background .12s;
}
.search-result-item:hover { background:var(--panel); }
.search-path { font-family:var(--mono); font-size:12px; color:var(--muted); }

/* ─── PROGRESS ───────────────────────────────────── */
.progress-bar {
  height:3px; background:var(--border2); border-radius:99px; overflow:hidden;
  margin-top:8px;
}
.progress-fill {
  height:100%; background:linear-gradient(90deg,var(--accent),var(--accent2));
  border-radius:99px; transition:width .2s;
}

/* ─── EMPTY STATE ────────────────────────────────── */
.empty-state {
  text-align:center; padding:60px 20px;
  color:var(--muted);
}
.empty-state .big-icon { font-size:48px; margin-bottom:12px; opacity:.4; }
.empty-state p { font-size:14px; }

/* ─── SELECTED BANNER ────────────────────────────── */
.sel-banner {
  display:none; align-items:center; gap:10px;
  padding:8px 16px; background:rgba(79,143,255,.1);
  border-bottom:1px solid rgba(79,143,255,.25); font-size:13px;
}
.sel-banner.show { display:flex; }
.sel-banner strong { color:var(--accent); }
</style>
</head>
<body>

<?php if ($editFile) { ?>
<!-- ═══ EDITOR MODE ═══════════════════════════════════════════════════════ -->
<div class="app">
  <div class="topbar">
    <div class="logo">FileBridge</div>
    <a href="?dir=<?= urlencode($cwdRel)?>" class="btn btn-ghost btn-sm">
      <?= icon('arrow-left')?> Back
    </a>
  </div>
  <form method="POST" class="editor-wrap" style="flex:1;display:flex;flex-direction:column;">
    <input type="hidden" name="action" value="save">
    <input type="hidden" name="filepath" value="<?= htmlspecialchars(str_replace(ROOT, '', $editFile))?>">
    <div class="editor-bar">
      <span class="filename"><?= htmlspecialchars(str_replace(ROOT, '', $editFile))?></span>
      <span class="file-meta" style="margin-right:auto"><?= formatSize(filesize($editFile))?></span>
      <button type="submit" class="btn btn-primary btn-sm"><?= icon('save')?> Save</button>
    </div>
    <?php if ($message['text']) { ?>
    <div class="toast toast-<?= $message['type']?>" style="margin:10px 16px 0;"><?= $message['text']?></div>
    <?php } ?>
    <textarea id="editor-textarea" name="content" spellcheck="false"><?= htmlspecialchars($editContent)?></textarea>
  </form>
</div>

<?php } else { ?>
<!-- ═══ MAIN FILE MANAGER ═════════════════════════════════════════════════ -->
<div class="app">

<!-- TOP BAR -->
<div class="topbar">
  <div class="logo">&#9670; FileBridge</div>
  <form method="GET" class="topbar-search">
    <?php if ($cwdRel !== '/') {
        echo '<input type="hidden" name="dir" value="'.htmlspecialchars($cwdRel).'">';
    } ?>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="text" name="search" placeholder="Search files..." value="<?= htmlspecialchars($_GET['search'] ?? '')?>">
  </form>
  <div class="topbar-actions">
    <button class="btn btn-ghost btn-sm" onclick="showModal('modal-repo')"><?= icon('git')?> Git Repo</button>
    <button class="btn btn-ghost btn-sm" onclick="openUpload('folder')"><?= icon('folder-plus')?> Folder</button>
    <button class="btn btn-primary btn-sm" onclick="openUpload('files')"><?= icon('upload')?> Upload</button>
  </div>
</div>

<div class="main">

<!-- SIDEBAR -->
<div class="sidebar">
  <div class="sidebar-section">
    <div class="sidebar-title">Navigation</div>
    <a class="sidebar-item <?= $cwdRel === '/' ? 'active' : ''?>" href="?"><?= icon('home')?> Root</a>
    <a class="sidebar-item" href="?dir=<?= urlencode($cwdRel)?>&search=*.php"><?= icon('code')?> PHP Files</a>
    <a class="sidebar-item" href="?dir=<?= urlencode($cwdRel)?>&search=*.js"><?= icon('file')?> JS Files</a>
    <a class="sidebar-item" href="?dir=<?= urlencode($cwdRel)?>&search=*.zip"><?= icon('archive')?> Archives</a>
  </div>
  <div class="sidebar-section" style="margin-top:8px">
    <div class="sidebar-title">Actions</div>
    <div class="sidebar-item" onclick="showModal('modal-mkdir')"><?= icon('folder-plus')?> New Folder</div>
    <div class="sidebar-item" onclick="showModal('modal-mkfile')"><?= icon('file-plus')?> New File</div>
    <div class="sidebar-item" onclick="openUpload('files')"><?= icon('upload')?> Upload Files</div>
    <div class="sidebar-item" onclick="openUpload('folder')"><?= icon('folder-plus')?> Upload Folder</div>
    <div class="sidebar-item" onclick="showModal('modal-repo')"><?= icon('git')?> Download Repo</div>
  </div>
  <div class="sidebar-section" style="margin-top:8px">
    <div class="sidebar-title">Info</div>
    <div class="sidebar-item"><?= icon('info')?>
      <?php
        $du = disk_free_space(ROOT);
    $dt = disk_total_space(ROOT);
    echo formatSize($dt - $du).' used';
    ?>
    </div>
    <div class="sidebar-item"><?= icon('hard-drive')?> <?= formatSize(disk_free_space(ROOT))?> free</div>
  </div>
</div>

<!-- CONTENT -->
<div class="content">

<!-- TOOLBAR -->
<div class="toolbar">
  <div class="breadcrumb">
    <a href="?">root</a>
    <?php
    $builtPath = '';
    foreach ($breadParts as $part) {
        $builtPath .= '/'.$part;
        echo '<span>›</span>';
        if ($part === end($breadParts)) {
            echo '<span class="current">'.htmlspecialchars($part).'</span>';
        } else {
            echo '<a href="?dir='.urlencode($builtPath).'">'.htmlspecialchars($part).'</a>';
        }
    }
    ?>
  </div>
  <button class="btn btn-ghost btn-sm" onclick="showModal('modal-mkdir')"><?= icon('folder-plus')?> Folder</button>
  <button class="btn btn-ghost btn-sm" onclick="showModal('modal-mkfile')"><?= icon('file-plus')?> File</button>
  <button class="btn btn-ghost btn-sm" id="btn-zip" onclick="bulkAction('zip')" style="display:none"><?= icon('archive')?> Zip</button>
  <button class="btn btn-danger btn-sm" id="btn-del" onclick="bulkAction('delete')" style="display:none"><?= icon('trash')?> Delete</button>
</div>

<!-- SELECTED BANNER -->
<div class="sel-banner" id="sel-banner">
  <strong id="sel-count">0</strong> item(s) selected &nbsp;
  <button class="btn btn-ghost btn-sm" onclick="selectAll()"><?= icon('check-square')?> All</button>
  <button class="btn btn-ghost btn-sm" onclick="selectNone()"><?= icon('square')?> None</button>
  <button class="btn btn-ghost btn-sm" onclick="bulkAction('zip')"><?= icon('archive')?> Zip Selected</button>
  <button class="btn btn-danger btn-sm" onclick="bulkAction('delete')"><?= icon('trash')?> Delete Selected</button>
</div>

<!-- MESSAGE -->
<?php if ($message['text']) { ?>
<div class="toast toast-<?= $message['type']?>" style="margin:12px 16px 0">
  <?= $message['type'] === 'success' ? '✓' : '✗'?> <?= htmlspecialchars($message['text'])?>
</div>
<?php } ?>

<!-- FILE AREA -->
<div class="file-area" id="file-area">

<?php if ($searchResults !== null) { ?>
<!-- SEARCH RESULTS -->
<div style="padding-bottom:12px">
  <strong><?= count($searchResults)?> result(s) for "<?= htmlspecialchars($_GET['search'] ?? '')?>"</strong>
  <a href="?dir=<?= urlencode($cwdRel)?>" style="margin-left:12px;color:var(--muted);font-size:12px">Clear search</a>
</div>
<?php if (empty($searchResults)) { ?>
<div class="empty-state"><div class="big-icon">🔍</div><p>No files found.</p></div>
<?php } else {
    foreach ($searchResults as $sr) {
        $srRel = str_replace(ROOT, '', $sr); ?>
<div class="search-result-item">
  <span><?= is_dir($sr) ? '📁' : '📄'?></span>
  <div>
    <div>
      <?php if (is_dir($sr)) { ?>
        <a href="?dir=<?= urlencode($srRel)?>" class="file-name folder"><?= htmlspecialchars(basename($sr))?></a>
      <?php } else { ?>
        <a href="?edit=<?= urlencode($srRel)?>" class="file-name"><?= htmlspecialchars(basename($sr))?></a>
      <?php } ?>
    </div>
    <div class="search-path"><?= htmlspecialchars($srRel)?></div>
  </div>
  <?php if (is_file($sr)) { ?>
  <div style="margin-left:auto;display:flex;gap:6px">
    <a href="?download_file=<?= urlencode($srRel)?>" class="btn btn-ghost btn-sm"><?= icon('download')?></a>
  </div>
  <?php } ?>
</div>
<?php }
    } ?>

<?php } else { ?>
<!-- FILE TABLE -->
<?php if (empty($items)) { ?>
<div class="empty-state"><div class="big-icon">📂</div><p>This folder is empty.</p></div>
<?php } else { ?>
<table class="file-table" id="file-table">
<thead>
<tr>
  <th style="width:32px"><input type="checkbox" id="chk-all" onchange="toggleAll(this)"></th>
  <th>Name</th>
  <th>Size</th>
  <th>Modified</th>
  <th>Permissions</th>
  <th>Actions</th>
</tr>
</thead>
<tbody>
<?php
    $parentRel = dirname($cwdRel);
    if ($cwdRel !== '/') {
        echo '<tr><td></td><td colspan="5"><a href="?dir='.urlencode($parentRel).'" class="file-name" style="color:var(--muted)">📁 ..</a></td></tr>';
    }
    foreach ($items as $it) {
        $itRel = str_replace(ROOT, '', $it['full']);
        ?>
<tr data-name="<?= htmlspecialchars($it['name'])?>" oncontextmenu="ctxMenu(event,'<?= htmlspecialchars(addslashes($it['name']))?>','<?= $it['isDir'] ? 'dir' : 'file'?>')">
  <td><input type="checkbox" class="row-chk" value="<?= htmlspecialchars($it['name'])?>" onchange="updateSel()"></td>
  <td>
    <div class="file-icon">
      <span class="icon"><?= $it['isDir'] ? '📁' : getFileIcon($it['name'])?></span>
      <?php if ($it['isDir']) { ?>
        <a href="?dir=<?= urlencode($itRel)?>" class="file-name folder"><?= htmlspecialchars($it['name'])?></a>
      <?php } elseif (isText($it['full'])) { ?>
        <a href="?edit=<?= urlencode($itRel)?>" class="file-name"><?= htmlspecialchars($it['name'])?></a>
      <?php } elseif (isImage($it['full'])) { ?>
        <a href="#" class="file-name" onclick="previewImage('<?= urlencode($itRel)?>', '<?= htmlspecialchars(addslashes($it['name']))?>')"><?= htmlspecialchars($it['name'])?></a>
      <?php } else { ?>
        <span class="file-name" style="cursor:default"><?= htmlspecialchars($it['name'])?></span>
      <?php } ?>
    </div>
  </td>
  <td class="file-meta"><?= formatSize($it['size'])?></td>
  <td class="file-meta"><?= date('Y-m-d H:i', $it['mtime'])?></td>
  <td class="file-perms"><?= $it['perms']?></td>
  <td>
    <div class="row-actions">
      <?php if (! $it['isDir'] && isText($it['full'])) { ?>
      <a href="?edit=<?= urlencode($itRel)?>" class="btn btn-ghost btn-sm" title="Edit"><?= icon('edit')?></a>
      <?php } ?>
      <?php if (! $it['isDir']) { ?>
      <a href="?download_file=<?= urlencode($itRel)?>" class="btn btn-ghost btn-sm" title="Download"><?= icon('download')?></a>
      <?php } ?>
      <?php if (! $it['isDir'] && strtolower(pathinfo($it['name'], PATHINFO_EXTENSION)) === 'zip') { ?>
      <button class="btn btn-ghost btn-sm" title="Extract" onclick="doUnzip('<?= htmlspecialchars(addslashes($it['name']))?>')"><?= icon('archive')?></button>
      <?php } ?>
      <button class="btn btn-ghost btn-sm" title="Rename" onclick="doRename('<?= htmlspecialchars(addslashes($it['name']))?>')"><?= icon('rename')?></button>
      <button class="btn btn-ghost btn-sm" title="Copy" onclick="doCopy('<?= htmlspecialchars(addslashes($it['name']))?>')"><?= icon('copy')?></button>
      <button class="btn btn-ghost btn-sm" title="Permissions" onclick="doChmod('<?= htmlspecialchars(addslashes($it['name']))?>', '<?= substr(sprintf('%o', fileperms($it['full'])), -4)?>')"><?= icon('lock')?></button>
      <button class="btn btn-danger btn-sm" title="Delete" onclick="doDelete(['<?= htmlspecialchars(addslashes($it['name']))?>'])"><?= icon('trash')?></button>
    </div>
  </td>
</tr>
<?php } ?>
</tbody>
</table>
<?php } ?>
<?php } ?>

</div><!-- /file-area -->

<!-- INFO BAR -->
<div class="infobar">
  <span><?= icon('folder')?> <?= count($items)?> items</span>
  <span><?= icon('hard-drive')?> <?= formatSize(disk_free_space(ROOT))?> free</span>
  <span style="margin-left:auto;font-size:10px;opacity:.5">FileBridge v<?= VERSION?></span>
</div>

</div><!-- /content -->
</div><!-- /main -->
</div><!-- /app -->

<!-- ─── CONTEXT MENU ──────────────────────────────────────────────────────── -->
<div class="ctx-menu" id="ctx-menu">
  <div class="ctx-item" id="ctx-open">📂 Open</div>
  <div class="ctx-item" id="ctx-edit"><?= icon('edit')?> Edit</div>
  <div class="ctx-item" id="ctx-download"><?= icon('download')?> Download</div>
  <div class="ctx-sep"></div>
  <div class="ctx-item" id="ctx-rename"><?= icon('rename')?> Rename</div>
  <div class="ctx-item" id="ctx-copy"><?= icon('copy')?> Copy</div>
  <div class="ctx-item" id="ctx-zip"><?= icon('archive')?> Zip</div>
  <div class="ctx-item" id="ctx-unzip"><?= icon('archive')?> Extract</div>
  <div class="ctx-item" id="ctx-chmod"><?= icon('lock')?> Permissions</div>
  <div class="ctx-sep"></div>
  <div class="ctx-item danger" id="ctx-delete"><?= icon('trash')?> Delete</div>
</div>

<!-- ─── MODALS ────────────────────────────────────────────────────────────── -->

<!-- Create Folder -->
<div class="overlay" id="modal-mkdir">
<div class="modal">
  <h3><?= icon('folder-plus')?> &nbsp;New Folder</h3>
  <form method="POST">
    <input type="hidden" name="action" value="mkdir">
    <div class="modal-row">
      <label>Folder Name</label>
      <input type="text" name="name" required autofocus placeholder="my-folder">
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-mkdir')">Cancel</button>
      <button type="submit" class="btn btn-primary"><?= icon('folder-plus')?> Create</button>
    </div>
  </form>
</div></div>

<!-- Create File -->
<div class="overlay" id="modal-mkfile">
<div class="modal">
  <h3><?= icon('file-plus')?> &nbsp;New File</h3>
  <form method="POST">
    <input type="hidden" name="action" value="mkfile">
    <div class="modal-row">
      <label>File Name</label>
      <input type="text" name="name" required autofocus placeholder="index.php">
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-mkfile')">Cancel</button>
      <button type="submit" class="btn btn-primary"><?= icon('file-plus')?> Create</button>
    </div>
  </form>
</div></div>

<!-- Rename -->
<div class="overlay" id="modal-rename">
<div class="modal">
  <h3><?= icon('rename')?> &nbsp;Rename</h3>
  <form method="POST">
    <input type="hidden" name="action" value="rename">
    <input type="hidden" name="old_name" id="rename-old">
    <div class="modal-row">
      <label>New Name</label>
      <input type="text" name="new_name" id="rename-new" required>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-rename')">Cancel</button>
      <button type="submit" class="btn btn-primary">Rename</button>
    </div>
  </form>
</div></div>

<!-- Copy -->
<div class="overlay" id="modal-copy">
<div class="modal">
  <h3><?= icon('copy')?> &nbsp;Copy As</h3>
  <form method="POST">
    <input type="hidden" name="action" value="copy">
    <input type="hidden" name="src" id="copy-src">
    <div class="modal-row">
      <label>New Name (in same folder)</label>
      <input type="text" name="dst_name" id="copy-dst" required>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-copy')">Cancel</button>
      <button type="submit" class="btn btn-primary">Copy</button>
    </div>
  </form>
</div></div>

<!-- Chmod -->
<div class="overlay" id="modal-chmod">
<div class="modal">
  <h3><?= icon('lock')?> &nbsp;Change Permissions</h3>
  <form method="POST">
    <input type="hidden" name="action" value="chmod">
    <input type="hidden" name="target" id="chmod-target">
    <div class="modal-row">
      <label>Octal Mode (e.g. 0755)</label>
      <input type="text" name="mode" id="chmod-mode" required maxlength="4" placeholder="0755">
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-chmod')">Cancel</button>
      <button type="submit" class="btn btn-primary">Apply</button>
    </div>
  </form>
</div></div>

<!-- Zip -->
<div class="overlay" id="modal-zip">
<div class="modal">
  <h3><?= icon('archive')?> &nbsp;Create Archive</h3>
  <form method="POST" id="zip-form">
    <input type="hidden" name="action" value="zip">
    <div id="zip-hidden-targets"></div>
    <div class="modal-row">
      <label>Archive Name</label>
      <input type="text" name="zip_name" required placeholder="archive">
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-zip')">Cancel</button>
      <button type="submit" class="btn btn-primary"><?= icon('archive')?> Create</button>
    </div>
  </form>
</div></div>

<!-- Delete confirm -->
<div class="overlay" id="modal-delete">
<div class="modal">
  <h3><?= icon('trash')?> &nbsp;Confirm Delete</h3>
  <p id="delete-msg" style="color:var(--muted);margin-bottom:18px;font-size:13px">Are you sure?</p>
  <form method="POST" id="delete-form">
    <input type="hidden" name="action" value="delete">
    <div id="delete-hidden-targets"></div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-delete')">Cancel</button>
      <button type="submit" class="btn btn-danger"><?= icon('trash')?> Delete</button>
    </div>
  </form>
</div></div>

<!-- Git Repo Download -->
<div class="overlay" id="modal-repo">
<div class="modal">
  <h3><?= icon('git')?> &nbsp;Download GitHub Repository</h3>
  <form method="POST">
    <input type="hidden" name="action" value="download_repo">
    <div class="modal-row">
      <label>Repository ZIP URL</label>
      <input type="url" name="repo_url" required placeholder="https://github.com/user/repo/archive/refs/heads/main.zip">
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" onclick="hideModal('modal-repo')">Cancel</button>
      <button type="submit" class="btn btn-primary"><?= icon('git')?> Download</button>
    </div>
  </form>
</div></div>

<!-- Upload (Files + Folder) -->
<div class="overlay" id="modal-upload">
<div class="modal" style="max-width:480px">
  <h3><?= icon('upload')?> &nbsp;Upload</h3>

  <!-- Mode tabs -->
  <div class="upload-tabs">
    <button type="button" class="upload-tab active" id="tab-files" onclick="setUploadMode('files')">
      📄 &nbsp;Files
    </button>
    <button type="button" class="upload-tab" id="tab-folder" onclick="setUploadMode('folder')">
      📁 &nbsp;Folder
    </button>
  </div>

  <!-- Drop / click zone -->
  <div class="upload-zone" id="upload-zone" onclick="document.getElementById('upload-input').click()">
    <div class="icon" id="upload-icon">📤</div>
    <p id="upload-hint">Drop files here or click to browse</p>
    <p id="upload-sub" style="font-size:11px;margin-top:4px;color:var(--muted)">Multiple files supported</p>
  </div>

  <!-- Hidden file input — attributes toggled by JS -->
  <input type="file" id="upload-input" multiple style="display:none" onchange="handleUploadInput(this)">

  <!-- Progress -->
  <div id="upload-progress" style="display:none;margin-top:12px">
    <div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
    <p style="font-size:12px;color:var(--muted);margin-top:6px" id="upload-status">Uploading...</p>
  </div>

  <div class="modal-actions">
    <button type="button" class="btn btn-ghost" onclick="hideModal('modal-upload')">Cancel</button>
  </div>
</div></div>

<!-- Image Preview -->
<div class="overlay" id="modal-preview" onclick="hideModal('modal-preview')">
<div class="modal" style="max-width:90vw;text-align:center" onclick="event.stopPropagation()">
  <h3 id="preview-title" style="margin-bottom:14px">Preview</h3>
  <img id="preview-img" src="" alt="" style="max-width:100%;max-height:70vh;border-radius:6px;border:1px solid var(--border2)">
  <div class="modal-actions" style="justify-content:center;margin-top:14px">
    <button class="btn btn-ghost" onclick="hideModal('modal-preview')">Close</button>
    <a id="preview-dl" href="#" class="btn btn-primary"><?= icon('download')?> Download</a>
  </div>
</div></div>

<?php } // end main file manager?>

<script>
// ─── MODAL HELPERS ────────────────────────────────────────────────────────────
function showModal(id) { document.getElementById(id).classList.add('show'); }
function hideModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.overlay').forEach(o => {
  o.addEventListener('click', e => { if(e.target===o) o.classList.remove('show'); });
});

// ─── SELECTION ────────────────────────────────────────────────────────────────
function updateSel() {
  const chks = document.querySelectorAll('.row-chk:checked');
  const banner = document.getElementById('sel-banner');
  const cnt = document.getElementById('sel-count');
  if (!banner) return;
  cnt.textContent = chks.length;
  banner.classList.toggle('show', chks.length > 0);
}
function toggleAll(cb) {
  document.querySelectorAll('.row-chk').forEach(c => { c.checked = cb.checked; });
  updateSel();
}
function selectAll()  { document.querySelectorAll('.row-chk').forEach(c=>c.checked=true);  updateSel(); }
function selectNone() { document.querySelectorAll('.row-chk').forEach(c=>c.checked=false); updateSel(); }
function selectedNames() {
  return Array.from(document.querySelectorAll('.row-chk:checked')).map(c=>c.value);
}

// ─── BULK ACTIONS ─────────────────────────────────────────────────────────────
function bulkAction(type) {
  const names = selectedNames();
  if (!names.length) { alert('Select items first.'); return; }
  if (type === 'delete') doDelete(names);
  if (type === 'zip')    doZip(names);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
function doDelete(names) {
  const msg = document.getElementById('delete-msg');
  msg.textContent = 'Delete ' + names.length + ' item(s)? This cannot be undone.';
  const cont = document.getElementById('delete-hidden-targets');
  cont.innerHTML = names.map(n=>`<input type="hidden" name="targets[]" value="${escHtml(n)}">`).join('');
  showModal('modal-delete');
}

// ─── RENAME ───────────────────────────────────────────────────────────────────
function doRename(name) {
  document.getElementById('rename-old').value = name;
  document.getElementById('rename-new').value = name;
  showModal('modal-rename');
  setTimeout(()=>{ const el=document.getElementById('rename-new'); el.focus(); el.select(); },100);
}

// ─── COPY ─────────────────────────────────────────────────────────────────────
function doCopy(name) {
  document.getElementById('copy-src').value = name;
  document.getElementById('copy-dst').value = 'copy_of_' + name;
  showModal('modal-copy');
  setTimeout(()=>{ const el=document.getElementById('copy-dst'); el.focus(); el.select(); },100);
}

// ─── CHMOD ────────────────────────────────────────────────────────────────────
function doChmod(name, mode) {
  document.getElementById('chmod-target').value = name;
  document.getElementById('chmod-mode').value = mode;
  showModal('modal-chmod');
}

// ─── ZIP ──────────────────────────────────────────────────────────────────────
function doZip(names) {
  const cont = document.getElementById('zip-hidden-targets');
  cont.innerHTML = names.map(n=>`<input type="hidden" name="targets[]" value="${escHtml(n)}">`).join('');
  showModal('modal-zip');
}

// ─── UNZIP ────────────────────────────────────────────────────────────────────
function doUnzip(name) {
  if (!confirm('Extract "'+name+'" to a subfolder?')) return;
  const f = document.createElement('form');
  f.method = 'POST';
  f.innerHTML = `<input name="action" value="unzip"><input name="target" value="${escHtml(name)}">`;
  document.body.appendChild(f); f.submit();
}

// ─── IMAGE PREVIEW ───────────────────────────────────────────────────────────
function previewImage(rel, name) {
  document.getElementById('preview-title').textContent = name;
  document.getElementById('preview-img').src = '?preview=' + rel;
  document.getElementById('preview-dl').href = '?download_file=' + rel;
  showModal('modal-preview');
}

// ─── CONTEXT MENU ────────────────────────────────────────────────────────────
let ctxTarget = null, ctxType = null;
function ctxMenu(e, name, type) {
  e.preventDefault();
  ctxTarget = name; ctxType = type;
  const m = document.getElementById('ctx-menu');
  m.style.left = e.clientX + 'px';
  m.style.top  = e.clientY + 'px';
  m.classList.add('show');
  document.getElementById('ctx-open').style.display     = type==='dir'  ? '' : 'none';
  document.getElementById('ctx-edit').style.display     = type==='file' ? '' : 'none';
  document.getElementById('ctx-download').style.display = type==='file' ? '' : 'none';
  document.getElementById('ctx-unzip').style.display    = (type==='file' && name.endsWith('.zip')) ? '' : 'none';
}
document.addEventListener('click', ()=>document.getElementById('ctx-menu').classList.remove('show'));

document.getElementById('ctx-open')?.addEventListener('click', ()=>{
  if(ctxTarget) window.location='?dir='+encodeURIComponent('<?= $cwdRel?>/'+ctxTarget);
});
document.getElementById('ctx-edit')?.addEventListener('click', ()=>{
  if(ctxTarget) window.location='?edit='+encodeURIComponent('<?= $cwdRel?>/'+ctxTarget);
});
document.getElementById('ctx-download')?.addEventListener('click', ()=>{
  if(ctxTarget) window.location='?download_file='+encodeURIComponent('<?= $cwdRel?>/'+ctxTarget);
});
document.getElementById('ctx-rename')?.addEventListener('click', ()=>{ if(ctxTarget) doRename(ctxTarget); });
document.getElementById('ctx-copy')?.addEventListener('click',   ()=>{ if(ctxTarget) doCopy(ctxTarget); });
document.getElementById('ctx-zip')?.addEventListener('click',    ()=>{ if(ctxTarget) doZip([ctxTarget]); });
document.getElementById('ctx-unzip')?.addEventListener('click',  ()=>{ if(ctxTarget) doUnzip(ctxTarget); });
document.getElementById('ctx-chmod')?.addEventListener('click',  ()=>{ if(ctxTarget) doChmod(ctxTarget,'0755'); });
document.getElementById('ctx-delete')?.addEventListener('click', ()=>{ if(ctxTarget) doDelete([ctxTarget]); });

// ─── UPLOAD MODE ─────────────────────────────────────────────────────────────
let _uploadMode = 'files';

function openUpload(mode) {
  showModal('modal-upload');
  setUploadMode(mode);
  // For folder mode trigger the picker immediately
  if (mode === 'folder') document.getElementById('upload-input').click();
}

function setUploadMode(mode) {
  _uploadMode = mode;
  const input   = document.getElementById('upload-input');
  const hint    = document.getElementById('upload-hint');
  const sub     = document.getElementById('upload-sub');
  const icon    = document.getElementById('upload-icon');
  const tFiles  = document.getElementById('tab-files');
  const tFolder = document.getElementById('tab-folder');
  if (!input) return;

  if (mode === 'folder') {
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.removeAttribute('multiple');
    hint.textContent = 'Click to choose a folder';
    sub.textContent  = 'Entire folder structure will be preserved on upload';
    icon.textContent = '📁';
    tFiles.classList.remove('active');
    tFolder.classList.add('active');
  } else {
    input.removeAttribute('webkitdirectory');
    input.removeAttribute('directory');
    input.setAttribute('multiple', '');
    hint.textContent = 'Drop files here or click to browse';
    sub.textContent  = 'Multiple files supported';
    icon.textContent = '📤';
    tFolder.classList.remove('active');
    tFiles.classList.add('active');
  }
  // Clear previous selection so re-picking the same path fires 'change'
  input.value = '';
}

function handleUploadInput(input) {
  if (!input.files.length) return;
  uploadFiles(input.files, _uploadMode === 'folder');
}

// ─── DRAG & DROP UPLOAD ──────────────────────────────────────────────────────
const zone = document.getElementById('upload-zone');
if (zone) {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', async e => {
    e.preventDefault();
    zone.classList.remove('dragover');

    // Check whether any dropped item is a directory
    if (e.dataTransfer.items && e.dataTransfer.items.length) {
      const entries = Array.from(e.dataTransfer.items)
        .map(item => item.webkitGetAsEntry && item.webkitGetAsEntry())
        .filter(Boolean);

      if (entries.some(en => en.isDirectory)) {
        // Folder drop — read full tree then upload with paths
        setStatus('Reading folder structure…');
        showProgress();
        const pairs = await readEntries(entries, '');
        uploadPairs(pairs);
        return;
      }
    }

    // Plain file drop
    const files = e.dataTransfer.files;
    if (files.length) uploadFiles(files, false);
  });
}

// ─── FILESYSTEM ENTRY READER (for drag-dropped folders) ──────────────────────
async function readEntries(entries, basePath) {
  const pairs = [];
  for (const entry of entries) {
    if (entry.isFile) {
      await new Promise(res => entry.file(f => {
        pairs.push({ file: f, path: basePath + f.name });
        res();
      }));
    } else if (entry.isDirectory) {
      const sub = await readDirEntry(entry, basePath + entry.name + '/');
      pairs.push(...sub);
    }
  }
  return pairs;
}

async function readDirEntry(dirEntry, basePath) {
  const pairs = [];
  const reader = dirEntry.createReader();
  let batch;
  // Browsers may return entries in batches of ≤100; keep reading until empty
  do {
    batch = await new Promise((res, rej) => reader.readEntries(res, rej));
    for (const entry of batch) {
      if (entry.isFile) {
        await new Promise(res => entry.file(f => {
          pairs.push({ file: f, path: basePath + f.name });
          res();
        }));
      } else if (entry.isDirectory) {
        const sub = await readDirEntry(entry, basePath + entry.name + '/');
        pairs.push(...sub);
      }
    }
  } while (batch.length > 0);
  return pairs;
}

// ─── UPLOAD FUNCTIONS ─────────────────────────────────────────────────────────

// Upload File objects (from <input> or plain file drop)
function uploadFiles(files, usePaths) {
  const fd = new FormData();
  Array.from(files).forEach(f => {
    fd.append('upload_files[]', f);
    // webkitRelativePath is auto-set by the browser when webkitdirectory is used
    fd.append('relative_paths[]', usePaths && f.webkitRelativePath ? f.webkitRelativePath : '');
  });
  doXhrUpload(fd, files.length);
}

// Upload {file, path} pairs collected from dragged folders
function uploadPairs(pairs) {
  const fd = new FormData();
  pairs.forEach(({ file, path }) => {
    fd.append('upload_files[]', file);
    fd.append('relative_paths[]', path);
  });
  doXhrUpload(fd, pairs.length);
}

function doXhrUpload(fd, count) {
  showProgress();
  setStatus('Uploading ' + count + ' file(s)…');

  const xhr = new XMLHttpRequest();
  xhr.open('POST', window.location.href, true);
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const pct = Math.round(e.loaded / e.total * 100);
      const fill = document.getElementById('progress-fill');
      if (fill) fill.style.width = pct + '%';
      setStatus('Uploading… ' + pct + '%');
    }
  };
  xhr.onload = () => window.location.reload();
  xhr.onerror = () => setStatus('Upload failed. Please try again.');
  xhr.send(fd);
}

function showProgress() {
  const p = document.getElementById('upload-progress');
  const f = document.getElementById('progress-fill');
  if (p) p.style.display = 'block';
  if (f) f.style.width = '0%';
}
function setStatus(msg) {
  const s = document.getElementById('upload-status');
  if (s) s.textContent = msg;
}

// ─── KEYBOARD SHORTCUTS ──────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));
  if (e.key === 'F2') { const chk=document.querySelector('.row-chk:checked'); if(chk) doRename(chk.value); }
  if (e.key === 'Delete') { const names=selectedNames(); if(names.length) doDelete(names); }
  if ((e.ctrlKey||e.metaKey) && e.key==='a') {
    e.preventDefault(); selectAll();
  }
});

// ─── UTIL ─────────────────────────────────────────────────────────────────────
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
</script>
</body>
</html>
<?php

        // ─── ICON HELPER ─────────────────────────────────────────────────────────────
        function icon($name)
        {
            $icons = [
                'home' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
                'folder' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
                'folder-plus' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>',
                'file' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
                'file-plus' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
                'upload' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
                'download' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>',
                'trash' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
                'edit' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
                'rename' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
                'copy' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
                'archive' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
                'lock' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
                'save' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
                'info' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
                'hard-drive' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>',
                'code' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
                'git' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>',
                'arrow-left' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
                'check-square' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
                'square' => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
            ];

            return $icons[$name] ?? '';
        }

function getFileIcon($name)
{
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $map = [
        'php' => '🐘', 'js' => '🟨', 'ts' => '🟦', 'jsx' => '⚛️', 'tsx' => '⚛️',
        'html' => '🌐', 'htm' => '🌐', 'css' => '🎨', 'json' => '📋', 'xml' => '📋',
        'py' => '🐍', 'rb' => '💎', 'java' => '☕', 'c' => '©', 'cpp' => '©',
        'md' => '📝', 'txt' => '📝', 'log' => '📋', 'csv' => '📊',
        'zip' => '📦', 'tar' => '📦', 'gz' => '📦', 'rar' => '📦',
        'jpg' => '🖼️', 'jpeg' => '🖼️', 'png' => '🖼️', 'gif' => '🖼️', 'svg' => '🖼️', 'webp' => '🖼️',
        'pdf' => '📕', 'doc' => '📘', 'docx' => '📘', 'xls' => '📗', 'xlsx' => '📗',
        'mp3' => '🎵', 'mp4' => '🎬', 'mov' => '🎬', 'avi' => '🎬',
        'sql' => '🗄️', 'sh' => '⚙️', 'env' => '🔑', 'htaccess' => '🔒',
    ];

    return $map[$ext] ?? '📄';
}
?>