<#
Presses "Save" on the native "Save as" dialog that the Claude desktop app's built-in browser opens for
every download (its title looks like "blob:null/<guid>"), so images generated in Gemini can be
downloaded without clicking Save by hand.

How it finds the dialog: the dialog is a window *owned* by the Claude window. UI Automation hides such
windows under their owner, so this script lists windows with the Win32 API instead (EnumWindows),
reads the "File name" box, and posts a click (BM_CLICK) to the Save button.

Safety: it only touches a visible dialog whose title matches -TitleLike AND whose file name matches
-FileLike, so it never presses Save in an unrelated app. Afterwards it also answers Yes to Windows'
"... already exists. Do you want to replace it?" prompt, but only when that prompt names a file that
matches -FileLike.

Run it with Windows PowerShell, right after clicking Download (tools/gemini/ingest-download.ps1 does it for you):
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/gemini/accept-save-dialog.ps1
Exit code: 0 = pressed Save, 1 = no matching dialog before the timeout.
#>
param(
    [int]$TimeoutSec = 90,
    [string]$TitleLike = 'blob:*',
    [string]$FileLike = 'Gemini_Generated_Image_*'
)

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class FileDialogs {
    delegate bool EnumProc(IntPtr hwnd, IntPtr lParam);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc proc, IntPtr lParam);
    [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr parent, EnumProc proc, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr hwnd, StringBuilder text, int max);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr hwnd, StringBuilder text, int max);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] static extern int GetDlgCtrlID(IntPtr hwnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern IntPtr SendMessage(IntPtr hwnd, uint msg, IntPtr wParam, StringBuilder lParam);
    [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hwnd, uint msg, IntPtr wParam, IntPtr lParam);

    const uint WM_GETTEXT = 0x000D;
    const uint BM_CLICK = 0x00F5;

    static string ClassOf(IntPtr h) { var sb = new StringBuilder(256); GetClassName(h, sb, sb.Capacity); return sb.ToString(); }

    public static string Title(IntPtr h) { var sb = new StringBuilder(512); GetWindowText(h, sb, sb.Capacity); return sb.ToString(); }

    // every visible standard dialog window ("#32770"), owned ones included
    public static IntPtr[] FindAll() {
        var found = new List<IntPtr>();
        EnumWindows((h, l) => { if (IsWindowVisible(h) && ClassOf(h) == "#32770") found.Add(h); return true; }, IntPtr.Zero);
        return found.ToArray();
    }

    // a file dialog's File name box is the "Edit" control with id 1001, the Save button is the "Button" with id 1
    static IntPtr Child(IntPtr dlg, int id, string cls) {
        IntPtr hit = IntPtr.Zero;
        EnumChildWindows(dlg, (h, l) => { if (GetDlgCtrlID(h) == id && ClassOf(h) == cls) { hit = h; return false; } return true; }, IntPtr.Zero);
        return hit;
    }

    public static string FileName(IntPtr dlg) {
        IntPtr edit = Child(dlg, 1001, "Edit");
        if (edit == IntPtr.Zero) return null;
        var sb = new StringBuilder(1024);
        SendMessage(edit, WM_GETTEXT, (IntPtr)sb.Capacity, sb);
        return sb.ToString();
    }

    public static bool PressSave(IntPtr dlg) {
        IntPtr save = Child(dlg, 1, "Button");
        return save != IntPtr.Zero && PostMessage(save, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
    }

    // the "<file> already exists. Do you want to replace it?" prompt: a message box whose text names the file
    public static string MessageText(IntPtr dlg) {
        var sb = new StringBuilder();
        EnumChildWindows(dlg, (h, l) => {
            if (ClassOf(h) == "Static") { var t = Title(h); if (t.Length > 0) sb.Append(t).Append(' '); }
            return true;
        }, IntPtr.Zero);
        return sb.ToString();
    }

    // Yes is the button with id 6 (IDYES) whatever the language of Windows
    public static bool PressYes(IntPtr dlg) {
        IntPtr yes = Child(dlg, 6, "Button");
        return yes != IntPtr.Zero && PostMessage(yes, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
    }
}
'@

$deadline = (Get-Date).AddSeconds($TimeoutSec)
$pressed = $null
while ((Get-Date) -lt $deadline) {
    foreach ($dlg in [FileDialogs]::FindAll()) {
        if (-not $pressed) {
            if ([FileDialogs]::Title($dlg) -notlike $TitleLike) { continue }
            $name = [FileDialogs]::FileName($dlg)
            if (-not $name -or $name -notlike $FileLike) { continue }
            if ([FileDialogs]::PressSave($dlg)) {
                $pressed = Get-Date
                Write-Output "Save pressed for '$name'"
            }
        } elseif ([FileDialogs]::MessageText($dlg) -like "*$FileLike*") {
            # Windows asks before replacing a file that already exists: answer Yes
            if ([FileDialogs]::PressYes($dlg)) {
                Write-Output 'Replace confirmed'
                exit 0
            }
        }
    }
    # after Save, wait a moment for a possible "already exists" prompt, then we are done
    if ($pressed -and ((Get-Date) - $pressed).TotalSeconds -gt 4) { exit 0 }
    Start-Sleep -Milliseconds 300
}

Write-Output "No matching Save dialog within $TimeoutSec s"
exit 1
