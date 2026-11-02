# C# Oyun Atölyesi

C# ile sıfırdan **Yılan** oyunu yazmayı öğreten, Türkçe, tek sayfalık statik site.
Her bölümde kod + satır satır mantık açıklaması + sık yapılan hata + uygulama görevi var.
Sayfadaki **canlı laboratuvar**, oyun döngüsünün her adımını tarayıcıda gösterir.

## Çalıştırma

```bash
python -m http.server 4321
# http://127.0.0.1:4321
```

Sunucu gerekmez ama `index.html` dosyasını doğrudan açarsan "tam kodu göster"
bölümü tarayıcı güvenliği yüzünden dosyayı okuyamaz (indirme bağlantıları yine çalışır).

## İçerik

| Dosya | Açıklama |
| --- | --- |
| `index.html` | Tüm ders içeriği (9 bölüm, sözlük, indirme) |
| `assets/style.css` | Koyu tema tasarım |
| `assets/app.js` | Renklendirme, kopyala, görev takibi, oyun simülasyonu |
| `downloads/Snake.cs` | Çalışan oyunun tam kaynağı (280 satır) |
| `downloads/Snake.csproj` | .NET 8 proje dosyası |

## Oyunu çalıştırma

```bash
cd downloads
dotnet run
```

Ok tuşları veya WASD ile oynanır, `Ctrl+C` ile çıkılır. Oyun mantığı 18 testle
(hareket, duvar, kendine çarpma, kuyruk kuralı, yem, hız) doğrulanmıştır.
