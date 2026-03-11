import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function yesNo(value, lang = "en") {
  if (value === "yes") return lang === "es" ? "Sí" : "Yes";
  if (value === "no") return lang === "es" ? "No" : "No";
  return "";
}

function clientStatusLabel(value, lang = "en") {
  if (value === "new") return lang === "es" ? "Cliente nuevo" : "New client";
  if (value === "existing") return lang === "es" ? "Cliente existente" : "Existing client";
  return "";
}

function buildHtmlEmail(payload) {
  const lang = payload?.language || "en";
  const data = payload?.data || {};
  const borrower = data.borrower || {};
  const loan = data.loan || {};
  const identity = data.identity || {};
  const housing = data.housing || {};
  const currentHousing = housing.current || {};
  const otherProperty = data.otherProperty || {};
  const credit = data.credit || {};
  const notes = data.notes || {};

  const jobs = Array.isArray(data?.employment?.jobs) ? data.employment.jobs : [];
  const debts = Array.isArray(data?.debts) ? data.debts : [];
  const assets = Array.isArray(data?.assets) ? data.assets : [];

  const clientStatus = clientStatusLabel(borrower.clientStatus, lang);

  const realtorLine =
    borrower.hasRealtor === "yes"
      ? `<p><strong>${lang === "es" ? "¿Tiene realtor?" : "Has realtor"}:</strong> ${lang === "es" ? "Sí" : "Yes"}<br>
         <strong>${lang === "es" ? "Nombre del realtor" : "Realtor name"}:</strong> ${esc(borrower.realtorName || "")}</p>`
      : `<p><strong>${lang === "es" ? "¿Tiene realtor?" : "Has realtor"}:</strong> ${lang === "es" ? "No" : "No"}</p>`;

  const jobsHtml = jobs.length
    ? `<ul>${jobs
        .map(
          (job) => `
        <li>
          <strong>${esc(job.type || "")}</strong> — ${esc(job.employerName || "")}<br>
          <strong>${lang === "es" ? "Inicio" : "Start"}:</strong> ${esc(job.startDate || "")}<br>
          <strong>${lang === "es" ? "Actual" : "Current"}:</strong> ${esc(job.isCurrent || "")}<br>
          <strong>${lang === "es" ? "Fin" : "End"}:</strong> ${esc(job.endDate || "")}<br>
          <strong>${lang === "es" ? "Posición" : "Position"}:</strong> ${esc(job.position || "")}<br>
          <strong>${lang === "es" ? "Ingreso mensual" : "Monthly income"}:</strong> ${esc(
            job.monthlyIncome || job.monthlySalary || ""
          )}
        </li>
      `
        )
        .join("")}</ul>`
    : `<p>${lang === "es" ? "No se enviaron empleos." : "No jobs submitted."}</p>`;

  const debtsHtml = debts.some((d) => d?.name || d?.balance || d?.monthlyPayment)
    ? `<ul>${debts
        .filter((d) => d?.name || d?.balance || d?.monthlyPayment)
        .map(
          (d) => `
        <li>
          ${esc(d.name || "")} — ${lang === "es" ? "Balance" : "Balance"}: ${esc(
            d.balance || ""
          )} — ${lang === "es" ? "Pago mensual" : "Monthly"}: ${esc(d.monthlyPayment || "")}
        </li>
      `
        )
        .join("")}</ul>`
    : `<p>${lang === "es" ? "No se listaron deudas." : "No debts listed."}</p>`;

  const assetsHtml = assets.some((a) => a?.type || a?.amount)
    ? `<ul>${assets
        .filter((a) => a?.type || a?.amount)
        .map(
          (a) => `
        <li>
          ${esc(a.type || "")} — ${lang === "es" ? "Monto" : "Amount"}: ${esc(a.amount || "")}
        </li>
      `
        )
        .join("")}</ul>`
    : `<p>${lang === "es" ? "No se listaron fondos." : "No assets listed."}</p>`;

  return `
    <h2>${lang === "es" ? "Nueva pre-solicitud" : "New Pre-Application Form"}</h2>
    <p><strong>${lang === "es" ? "Enviado" : "Submitted"}:</strong> ${esc(payload?.submittedAt || "")}</p>
    <p><strong>${lang === "es" ? "Idioma" : "Language"}:</strong> ${esc(lang)}</p>

    <h3>${lang === "es" ? "Solicitante" : "Applicant"}</h3>
    <p>
      <strong>${lang === "es" ? "Nombre" : "Name"}:</strong> ${esc(borrower.firstName || "")} ${esc(
    borrower.lastName || ""
  )}<br>
      <strong>Email:</strong> ${esc(borrower.email || "")}<br>
      <strong>${lang === "es" ? "Teléfono" : "Phone"}:</strong> ${esc(borrower.phone || "")}<br>
      <strong>DOB:</strong> ${esc(borrower.dob || "")}<br>
      <strong>${lang === "es" ? "Estado civil" : "Marital status"}:</strong> ${esc(
    borrower.maritalStatus || ""
  )}<br>
      <strong>${lang === "es" ? "Tipo de cliente" : "Client status"}:</strong> ${esc(clientStatus)}
    </p>

    ${realtorLine}

    <h3>${lang === "es" ? "Préstamo" : "Loan"}</h3>
    <p>
      <strong>${lang === "es" ? "Intención" : "Intent"}:</strong> ${esc(loan.intent || "")}<br>
      <strong>${lang === "es" ? "Tipo de refi" : "Refi type"}:</strong> ${esc(loan.refiType || "")}<br>
      <strong>${lang === "es" ? "Ocupación" : "Occupancy"}:</strong> ${esc(loan.occupancy || "")}
    </p>

    <h3>${lang === "es" ? "Identificación" : "Identification"}</h3>
    <p>
      <strong>${lang === "es" ? "Tipo de ID" : "ID type"}:</strong> ${esc(identity.idType || "")}<br>
      <strong>${lang === "es" ? "Estatus SSN" : "SSN status"}:</strong> ${esc(identity.ssnStatus || "")}<br>
      <strong>${lang === "es" ? "Pasaporte vigente" : "Passport valid"}:</strong> ${esc(
    identity.passportValid || ""
  )}
    </p>

    <h3>${lang === "es" ? "Vivienda" : "Housing"}</h3>
    <p>
      <strong>${lang === "es" ? "Dirección actual" : "Current address"}:</strong>
      ${esc(currentHousing.street || "")}, ${esc(currentHousing.city || "")}, ${esc(
    currentHousing.state || ""
  )} ${esc(currentHousing.zip || "")}<br>
      <strong>${lang === "es" ? "Tipo de vivienda" : "Housing type"}:</strong> ${esc(
    currentHousing.ownRent || ""
  )}<br>
      <strong>${lang === "es" ? "Pago mensual" : "Monthly payment"}:</strong> ${esc(
    currentHousing.monthlyPayment || ""
  )}<br>
      <strong>${lang === "es" ? "Tiempo allí" : "Time there"}:</strong> ${esc(
    currentHousing.years || ""
  )} ${lang === "es" ? "años" : "years"}, ${esc(currentHousing.months || "")} ${
    lang === "es" ? "meses" : "months"
  }
    </p>

    <p>
      <strong>${lang === "es" ? "Otra propiedad" : "Other property"}:</strong> ${yesNo(
    otherProperty.hasOther,
    lang
  )}<br>
      <strong>${lang === "es" ? "Dirección de otra propiedad" : "Other property address"}:</strong> ${esc(
    otherProperty.address || ""
  )}<br>
      <strong>${lang === "es" ? "Estatus de otra propiedad" : "Other property status"}:</strong> ${esc(
    otherProperty.lienStatus || ""
  )}
    </p>

    <h3>${lang === "es" ? "Empleo" : "Employment"}</h3>
    ${jobsHtml}

    <h3>${lang === "es" ? "Crédito" : "Credit"}</h3>
    <p>
      <strong>${lang === "es" ? "Tiene crédito" : "Has credit"}:</strong> ${yesNo(
    credit.hasCredit,
    lang
  )}<br>
      <strong>${lang === "es" ? "Puntaje aprox." : "Approx score"}:</strong> ${esc(
    credit.approxScore || ""
  )}
    </p>

    <h3>${lang === "es" ? "Deudas" : "Debts"}</h3>
    ${debtsHtml}

    <h3>${lang === "es" ? "Fondos / Ahorros" : "Assets / Savings"}</h3>
    ${assetsHtml}

    <h3>${lang === "es" ? "Comentarios" : "Comments"}</h3>
    <p>${esc(notes.clientComments || "")}</p>
  `;
}

function buildConfirmationEmail(payload) {
  const lang = payload?.language || "en";
  const borrower = payload?.data?.borrower || {};
  const fullName = `${borrower.firstName || ""} ${borrower.lastName || ""}`.trim();

  if (lang === "es") {
    return {
      subject: "Recibimos tu pre-solicitud",
      html: `
        <h2>Gracias${borrower.firstName ? `, ${esc(borrower.firstName)}` : ""}</h2>
        <p>Recibimos tu información correctamente.</p>
        <p>Nuestro equipo revisará tu pre-solicitud y se pondrá en contacto contigo pronto.</p>
        <p><strong>Nombre:</strong> ${esc(fullName)}</p>
        <p><strong>Email:</strong> ${esc(borrower.email || "")}</p>
        <p>Gracias por confiar en MortgageMax.</p>
      `
    };
  }

  return {
    subject: "We received your pre-application",
    html: `
      <h2>Thank you${borrower.firstName ? `, ${esc(borrower.firstName)}` : ""}</h2>
      <p>We received your information successfully.</p>
      <p>Our team will review your pre-application and contact you soon.</p>
      <p><strong>Name:</strong> ${esc(fullName)}</p>
      <p><strong>Email:</strong> ${esc(borrower.email || "")}</p>
      <p>Thank you for choosing MortgageMax.</p>
    `
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body || {};
    const borrower = payload?.data?.borrower || {};
    const fullName = `${borrower.firstName || ""} ${borrower.lastName || ""}`.trim();
    const recipients = (process.env.TO_EMAIL || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    const emailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: recipients,
      subject: `New MortgageMax Intake${fullName ? ` - ${fullName}` : ""}`,
      html: buildHtmlEmail(payload),
      replyTo: borrower.email || undefined
    });

    if (process.env.SEND_CONFIRMATION === "true" && borrower.email) {
      const confirmation = buildConfirmationEmail(payload);

      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: [borrower.email],
        subject: confirmation.subject,
        html: confirmation.html
      });
    }

    return res.status(200).json({ ok: true, emailResult });
  } catch (error) {
    console.error("Intake error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
}