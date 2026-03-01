import Image from "next/image";
import { buildSharedCheckinUrl, qrImageUrl } from "@/lib/checkin/qr";

export default function QrCheckinModule() {
  const checkinUrl = buildSharedCheckinUrl();
  const imageUrl = qrImageUrl(checkinUrl);

  return (
    <section className="module-grid single-col">
      <article className="card qr-card tinted-card t1">
        <h2>Single QR Check-In</h2>
        <p className="muted">Scan once, enter Member ID, and mark attendance.</p>
        <Image
          src={imageUrl}
          alt="Shared gym check-in QR"
          width={220}
          height={220}
          unoptimized
        />
        <p className="muted small">Print this QR at the front desk</p>
        <p className="muted small qr-url">{checkinUrl}</p>
      </article>
    </section>
  );
}
