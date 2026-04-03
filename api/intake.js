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

function getJobMonthlyIncome(job = {}) {
  if (job.monthlyIncome) return job.monthlyIncome;
  if (job.monthlySalary) return job.monthlySalary;

  const hours = parseFloat(job.hoursPerWeek || 0);
  const rate = parseFloat(job.hourlyRate || 0);

  if (hours > 0 && rate > 0) {
    return Math.round(hours * rate * 4.3333).toString();
  }

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
          <strong>${lang === "es" ? "Horas por semana" : "Hours per week"}:</strong> ${esc(job.hoursPerWeek || "")}<br>
          <strong>${lang === "es" ? "Pago por hora" : "Hourly rate"}:</strong> ${esc(job.hourlyRate ? `$${job.hourlyRate}` : "")}<br>
          <strong>${lang === "es" ? "Ingreso mensual" : "Monthly income"}:</strong> ${esc(getJobMonthlyIncome(job))}
          <strong> Ownership %: </strong> ${esc(job.ownershipPct ? `${job.ownershipPct}%` : "")} <br>
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
  const firstName = borrower.firstName || "";

  const docsLink =
    payload?.links?.documents ||
    process.env.DOCUMENTS_LINK ||
    "#";

  const bookingLink =
    payload?.links?.booking ||
    process.env.BOOKING_LINK ||
    "#";

  if (lang === "es") {
    return {
      subject: "Recibimos tu pre-aplicación de préstamo",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 700px; margin: 0 auto;">
          <p>Hola${firstName ? ` ${esc(firstName)}` : ""},</p>

          <p>Gracias por confiar en nosotros y completar tu pre-aplicación de préstamo.</p>

          <p>
            Queremos confirmarte que hemos recibido tu información correctamente y que nuestro equipo ya se encuentra revisándola
            para poder orientarte de la mejor manera posible.
          </p>

          <p>Tu proceso ya comenzó, y este sería el avance hasta ahora:</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <strong>Tu progreso</strong>
            <p>✔️ Paso 1: Pre-aplicación enviada</p>
            <p>🔄 Paso 2: Revisión de documentos (siguiente paso)</p>
            <p>⬜ Paso 3: Análisis y estimados iniciales</p>
            <p>⬜ Paso 4: Pre-aprobación</p>
          </div>

          <p>Ya completaste el primer paso; ahora vamos por el siguiente.</p>

          <p>
            Para continuar, necesitamos avanzar con la revisión de tus documentos. Este paso nos permite iniciar tu aplicación formal,
            validar tu perfil financiero y brindarte una orientación mucho más clara sobre tus opciones.
          </p>

          <p>
            <strong>Revisa la lista de documentos aquí:</strong><br>
            <a href="${esc(docsLink)}">🔗 Lista de documentos</a>
          </p>

          <ul>
            <li>Responder a este correo con tus documentos</li>
            <li>Enviar un mensaje si necesitas ayuda</li>
            <li>Llamarnos para revisar el proceso</li>
            <li>
              Agendar cita:
              <a href="${esc(bookingLink)}">🔗 Agendar</a>
            </li>
          </ul>

          <p>
            Uno de nuestros especialistas te contactará pronto para guiarte en los siguientes pasos.
          </p>

          <p>Si tienes dudas, responde a este correo. Estamos para ayudarte.</p>

          <br>

          <strong>MortgageMax Team</strong><br>
          (205) 953-1633<br>
          girard@mortgagemax.net

          <hr>

          <p style="font-size: 10px; color: #6b7280;">
          Importante: La información enviada en la pre-aplicación se utiliza como una evaluación inicial
          y no representa una aprobación final de préstamo. Toda aprobación está sujeta a la revisión completa de 
          documentos, verificación de crédito, ingresos, activos, empleo, valoración de la propiedad y demás requisitos 
          del prestamista. Los términos del préstamo, incluyendo tasa de interés, pago mensual y costos de cierre, 
          pueden cambiar una vez se complete el análisis formal.           
          </p>
        </div>
      `
    };
  }

  return {
    subject: "We received your loan pre-application",
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 700px; margin: 0 auto;">
        <p>Hello${firstName ? ` ${esc(firstName)}` : ""},</p>

        <p>Thank you for trusting us and completing your loan pre-application.</p>

        <p>
          We confirm that we received your information successfully and our team is already reviewing it.
        </p>

        <p>Your process has started. Here's your progress:</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <strong>Your progress</strong>
          <p>✔️ Step 1: Pre-application submitted</p>
          <p>🔄 Step 2: Document review (next step)</p>
          <p>⬜ Step 3: Initial review and estimates</p>
          <p>⬜ Step 4: Pre-approval</p>
        </div>

        <p>Next step: document review.</p>

        <p>
          This allows us to verify your profile and give you clearer loan options including payment estimates and closing costs.
        </p>

        <p>
          <strong>Check the document list:</strong><br>
          <a href="${esc(docsLink)}">🔗 Document checklist</a>
        </p>

        <ul>
          <li>Reply to this email with documents</li>
          <li>Text us for help</li>
          <li>Call us for guidance</li>
          <li>
            Schedule a call:
            <a href="${esc(bookingLink)}">🔗 Schedule</a>
          </li>
        </ul>

        <p>A specialist will reach out shortly to guide you.</p>

        <p>If you have questions, just reply to this email.</p>

        <br>

        <strong>MortgageMax Team</strong><br>
        (205) 953-1633<br>
        girard@mortgagemax.net

        <hr>
        <p style="font-size: 10px; color: #6b7280;">
          Important: The information submitted in the pre-application is used as an initial evaluation
          and does not represent a final loan approval. All approvals are subject to full review of
          documents, verification of credit, income, assets, employment, property appraisal, and any other
          lender requirements. Loan terms, including interest rate, monthly payment, and closing costs,
          may change once the formal review is completed.
        </p>
      </div>
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

    const replyToList = (process.env.REPLY_TO || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

    const emailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: recipients,
      subject: `New Pre-Application ${fullName ? ` - ${fullName}` : ""}`,
      html: buildHtmlEmail(payload),
      replyTo: borrower.email || undefined
    });

    if (process.env.SEND_CONFIRMATION === "true" && borrower.email) {
      const confirmation = buildConfirmationEmail(payload);

      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: borrower.email,
        subject: confirmation.subject,
        html: confirmation.html,
        replyTo: replyToList.length ? replyToList : undefined
      });
    }

    return res.status(200).json({ ok: true, emailResult });
  } catch (error) {
    console.error("Intake error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
}