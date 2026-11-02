using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading;

namespace YilanOyunu
{
    // Oyundaki bir kareyi (hücreyi) temsil eder: kaçıncı sütun, kaçıncı satır.
    struct Konum
    {
        public int X;
        public int Y;

        public Konum(int x, int y)
        {
            X = x;
            Y = y;
        }
    }

    class Program
    {
        // ---------------- Ayarlar ----------------
        const int Genislik = 30;   // oyun alanının genişliği (sütun sayısı)
        const int Yukseklik = 20;  // oyun alanının yüksekliği (satır sayısı)
        const char Bos = ' ';
        const char Duvar = '#';
        const char Kafa = '@';
        const char Govde = 'o';
        const char YemKarakter = '*';

        static readonly Random rastgele = new Random();

        // ---------------- Oyunun durumu ----------------
        static readonly List<Konum> yilan = new List<Konum>();
        static Konum yem;
        static Konum yon = new Konum(1, 0);         // şu an gittiği yön
        static Konum bekleyenYon = new Konum(1, 0); // tuştan gelen, bir sonraki adımda uygulanacak yön

        static int skor;
        static int enYuksekSkor;
        static int hiz = 8;       // saniyede kaç adım atılacak
        static bool oyunBitti;

        static void Main()
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.CursorVisible = false;
            Console.Title = "Yılan Oyunu - C#";

            // Ctrl+C ile çıkıldığında imleci geri getir.
            Console.CancelKeyPress += (gonderen, olay) =>
            {
                Console.CursorVisible = true;
                Console.ResetColor();
            };

            while (true)
            {
                OyunuBaslat();
                OyunDongusu();
                OyunBittiEkrani();
            }
        }

        // Oyunu ilk (veya yeniden) başlatır.
        static void OyunuBaslat()
        {
            Console.Clear();

            yilan.Clear();
            int ortaX = Genislik / 2;
            int ortaY = Yukseklik / 2;

            // Kafa listenin 0. elemanı. 3 parçalı başlıyoruz.
            yilan.Add(new Konum(ortaX, ortaY));
            yilan.Add(new Konum(ortaX - 1, ortaY));
            yilan.Add(new Konum(ortaX - 2, ortaY));

            yon = new Konum(1, 0);
            bekleyenYon = yon;

            skor = 0;
            hiz = 8;
            oyunBitti = false;

            YemUret();
            Ciz();
        }

        // Boş bir kareye yeni yem koyar.
        static void YemUret()
        {
            do
            {
                yem = new Konum(rastgele.Next(1, Genislik - 1),
                                rastgele.Next(1, Yukseklik - 1));
            }
            while (yilan.Exists(parca => parca.X == yem.X && parca.Y == yem.Y));
        }

        // Basılan tuşları okur ve yönü günceller.
        static void YonOku()
        {
            // KeyAvailable, okunmayı bekleyen tuş var mı diye sorar.
            // ReadKey(false/true) tuşu bekletmeden alır: true -> ekrana basma.
            while (Console.KeyAvailable)
            {
                ConsoleKeyInfo tus = Console.ReadKey(true);
                Konum istenen = yon;

                switch (tus.Key)
                {
                    case ConsoleKey.UpArrow:
                    case ConsoleKey.W:
                        istenen = new Konum(0, -1);
                        break;
                    case ConsoleKey.DownArrow:
                    case ConsoleKey.S:
                        istenen = new Konum(0, 1);
                        break;
                    case ConsoleKey.LeftArrow:
                    case ConsoleKey.A:
                        istenen = new Konum(-1, 0);
                        break;
                    case ConsoleKey.RightArrow:
                    case ConsoleKey.D:
                        istenen = new Konum(1, 0);
                        break;
                }

                // 180 derece dönüşü engelle: zıt yönlerin toplamı (0,0) eder.
                if (istenen.X + yon.X != 0 || istenen.Y + yon.Y != 0)
                {
                    bekleyenYon = istenen;
                }
            }
        }

        // Yılanı bir adım ilerletir ve kuralları uygular.
        static void Adim()
        {
            yon = bekleyenYon;

            Konum kafa = yilan[0];
            Konum yeniKafa = new Konum(kafa.X + yon.X, kafa.Y + yon.Y);

            // 1) Duvara çarptı mı?
            if (yeniKafa.X <= 0 || yeniKafa.X >= Genislik - 1 ||
                yeniKafa.Y <= 0 || yeniKafa.Y >= Yukseklik - 1)
            {
                oyunBitti = true;
                return;
            }

            // 2) Kendine çarptı mı? Son parçayı saymıyoruz:
            //    yem yemediysek o parça bu adımda kaybolacak.
            for (int i = 0; i < yilan.Count - 1; i++)
            {
                if (yilan[i].X == yeniKafa.X && yilan[i].Y == yeniKafa.Y)
                {
                    oyunBitti = true;
                    return;
                }
            }

            // 3) Yeni kafayı başa ekle.
            yilan.Insert(0, yeniKafa);

            // 4) Yem yendi mi?
            if (yeniKafa.X == yem.X && yeniKafa.Y == yem.Y)
            {
                skor += 10;
                if (skor > enYuksekSkor)
                {
                    enYuksekSkor = skor;
                }

                // Her 50 puanda oyun biraz hızlansın.
                if (skor % 50 == 0 && hiz < 20)
                {
                    hiz++;
                }

                YemUret();
                // Kuyruğu silmiyoruz: yılan bir kare uzar.
            }
            else
            {
                // Yem yoksa kuyruğu sil: yılan aynı boyda kalır ama kaymış olur.
                yilan.RemoveAt(yilan.Count - 1);
            }
        }

        // Ekranı tek seferde çizer.
        static void Ciz()
        {
            var ekran = new StringBuilder();

            ekran.Append("  Skor: ").Append(skor)
                 .Append("    En iyi: ").Append(enYuksekSkor)
                 .Append("    Hız: ").Append(hiz)
                 .Append(Environment.NewLine);

            for (int y = 0; y < Yukseklik; y++)
            {
                for (int x = 0; x < Genislik; x++)
                {
                    char karakter = Bos;

                    if (x == 0 || x == Genislik - 1 || y == 0 || y == Yukseklik - 1)
                    {
                        karakter = Duvar;
                    }
                    else if (x == yem.X && y == yem.Y)
                    {
                        karakter = YemKarakter;
                    }
                    else
                    {
                        for (int i = 0; i < yilan.Count; i++)
                        {
                            if (yilan[i].X == x && yilan[i].Y == y)
                            {
                                karakter = (i == 0) ? Kafa : Govde;
                                break;
                            }
                        }
                    }

                    ekran.Append(karakter);
                }

                ekran.Append(Environment.NewLine);
            }

            ekran.Append("  Ok tuşları / WASD ile yön ver. Çıkmak için Ctrl+C.");

            // Tek bir Write ile yazınca ekran titremez.
            Console.SetCursorPosition(0, 0);
            Console.Write(ekran.ToString());
        }

        // Oyunun ana döngüsü: girdi -> güncelle -> çiz.
        static void OyunDongusu()
        {
            var saat = Stopwatch.StartNew();
            double sonAdim = 0;

            while (!oyunBitti)
            {
                double simdi = saat.Elapsed.TotalSeconds;

                // Adım zamanı geldiyse oyunu güncelle.
                if (simdi - sonAdim >= 1.0 / hiz)
                {
                    sonAdim = simdi;
                    YonOku();
                    Adim();
                    Ciz();
                }

                // Kısa bir bekleme: işlemciyi yormadan döngüyü canlı tut.
                Thread.Sleep(5);
            }
        }

        static void OyunBittiEkrani()
        {
            Console.SetCursorPosition(0, Yukseklik + 3);
            Console.WriteLine();
            Console.WriteLine("  OYUN BİTTİ!  Skorunuz: " + skor);
            Console.WriteLine("  Yeniden oynamak için bir tuşa basın...");
            Console.ReadKey(true);
        }
    }
}
