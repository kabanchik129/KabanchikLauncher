// KabanchikLauncher Bootstrapper
// Скомпилируй: csc Bootstrapper.cs /target:winexe /win32icon:icon.ico /out:KabanchikInstaller.exe
// Или используй dotnet: dotnet build
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Windows.Forms;

[STAThread]
class Program {
    const string GITHUB_USER = "kabanchik129";
    const string GITHUB_REPO = "KabanchikLauncher";

    static void Main() {
        Application.EnableVisualStyles();
        
        var form = new InstallerForm();
        Application.Run(form);
    }
}

class InstallerForm : Form {
    Label statusLabel;
    ProgressBar progress;
    Button cancelBtn;
    bool cancelled = false;

    public InstallerForm() {
        Text = "🐷 KabanchikLauncher Installer";
        Width = 480;
        Height = 220;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = System.Drawing.Color.FromArgb(30, 10, 18);
        ForeColor = System.Drawing.Color.FromArgb(248, 232, 240);

        var title = new Label {
            Text = "🐷 KabanchikLauncher",
            Font = new System.Drawing.Font("Segoe UI", 14, System.Drawing.FontStyle.Bold),
            ForeColor = System.Drawing.Color.FromArgb(255, 77, 148),
            AutoSize = true, Location = new System.Drawing.Point(20, 20),
        };
        Controls.Add(title);

        var sub = new Label {
            Text = "Скачивание и установка лаунчера...",
            ForeColor = System.Drawing.Color.FromArgb(201, 160, 184),
            AutoSize = true, Location = new System.Drawing.Point(22, 50),
        };
        Controls.Add(sub);

        progress = new ProgressBar {
            Location = new System.Drawing.Point(20, 90),
            Width = 420, Height = 24,
            Style = ProgressBarStyle.Continuous,
        };
        Controls.Add(progress);

        statusLabel = new Label {
            Text = "Подготовка...",
            ForeColor = System.Drawing.Color.FromArgb(138, 96, 128),
            AutoSize = true, Location = new System.Drawing.Point(20, 122),
        };
        Controls.Add(statusLabel);

        cancelBtn = new Button {
            Text = "Отмена",
            Location = new System.Drawing.Point(340, 150),
            Width = 100, Height = 30,
            FlatStyle = FlatStyle.Flat,
            ForeColor = System.Drawing.Color.FromArgb(248, 113, 113),
            BackColor = System.Drawing.Color.FromArgb(30, 10, 18),
        };
        cancelBtn.Click += (s, e) => { cancelled = true; Close(); };
        Controls.Add(cancelBtn);

        Shown += async (s, e) => await RunInstallation();
    }

    async System.Threading.Tasks.Task RunInstallation() {
        try {
            SetStatus("Получение последней версии...", 5);
            
            var client = new WebClient();
            client.Headers.Add("User-Agent", "KabanchikInstaller/1.0");
            
            var json = await client.DownloadStringTaskAsync(
                $"https://api.github.com/repos/{Program.GITHUB_USER}/{Program.GITHUB_REPO}/releases/latest"
            );
            
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var version = root.GetProperty("tag_name").GetString();
            
            string downloadUrl = null;
            string fileName = null;
            
            foreach (var asset in root.GetProperty("assets").EnumerateArray()) {
                var name = asset.GetProperty("name").GetString();
                if (name.EndsWith(".exe")) {
                    downloadUrl = asset.GetProperty("browser_download_url").GetString();
                    fileName = name;
                    break;
                }
            }
            
            if (downloadUrl == null) throw new Exception("Установщик не найден в релизе");
            
            SetStatus($"Скачивание {fileName} ({version})...", 10);
            
            var tempPath = Path.Combine(Path.GetTempPath(), fileName);
            
            client.DownloadProgressChanged += (s, e) => {
                SetStatus($"Скачивание... {e.ProgressPercentage}%", e.ProgressPercentage);
            };
            
            await client.DownloadFileTaskAsync(downloadUrl, tempPath);
            
            if (cancelled) return;
            
            SetStatus("Запуск установщика...", 100);
            
            Process.Start(new ProcessStartInfo(tempPath) { UseShellExecute = true }).WaitForExit();
            
            File.Delete(tempPath);
            
            MessageBox.Show("🐷 KabanchikLauncher установлен!\nХрю-хрю!", "Готово!", 
                MessageBoxButtons.OK, MessageBoxIcon.Information);
            
            Close();
        } catch (Exception ex) {
            if (!cancelled) {
                MessageBox.Show($"Ошибка: {ex.Message}\n\nПроверь:\n- GitHub репозиторий существует\n- Есть хотя бы один Release с .exe",
                    "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close();
            }
        }
    }

    void SetStatus(string text, int percent) {
        if (InvokeRequired) {
            Invoke(new Action(() => SetStatus(text, percent)));
            return;
        }
        statusLabel.Text = text;
        progress.Value = Math.Min(percent, 100);
    }
}
