export type CvData = Record<string, string>;

const value = (data: CvData, key: string) => data[key]?.trim() || "";

const numberedEntries = (data: CvData, keys: string[]) => {
  const suffixes = new Set([""]);
  Object.keys(data).forEach((key) => {
    keys.forEach((base) => {
      const match = key.match(new RegExp(`^${base}(\\d+)$`));
      if (match) suffixes.add(match[1]);
    });
  });
  return [...suffixes]
    .sort((a, b) => (Number(a) || 1) - (Number(b) || 1))
    .map((suffix) => keys.map((key) => value(data, `${key}${suffix}`)))
    .filter((entry) => entry.some(Boolean));
};

export async function downloadCvAsWord(data: CvData) {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } =
    await import("docx");

  const body = (
    text: string,
    options: { bold?: boolean; color?: string; after?: number } = {},
  ) =>
    new Paragraph({
      spacing: { after: options.after ?? 100, line: 276 },
      children: [
        new TextRun({
          text: text || "Niet ingevuld",
          bold: options.bold,
          color: options.color || "5F6F76",
          font: "Arial",
          size: 22,
        }),
      ],
    });
  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text,
          bold: true,
          color: "000000",
          font: "Arial",
          size: 28,
        }),
      ],
    });
  const field = (label: string, answer: string) => [
    body(label, { bold: true, color: "000000", after: 20 }),
    body(answer),
  ];

  const education = numberedEntries(data, [
    "school",
    "education",
    "educationStatus",
  ]);
  const experience = numberedEntries(data, [
    "organization",
    "experienceType",
    "experienceDescription",
  ]);
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: value(data, "name") || "Mijn cv",
          bold: true,
          color: "000000",
          font: "Arial",
          size: 40,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text:
            [
              value(data, "city"),
              value(data, "age") && `${value(data, "age")} jaar`,
              value(data, "phone"),
              value(data, "email"),
            ]
              .filter(Boolean)
              .join("  |  ") || "Contactgegevens nog niet ingevuld",
          color: "5F6F76",
          font: "Arial",
          size: 22,
        }),
      ],
    }),
    heading("Over mij"),
    ...field("Hoe zou je jezelf omschrijven", value(data, "description")),
    ...field("Waar ben je goed in", value(data, "strengths")),
    ...field(
      "Wat vind je leuk en waar krijg je energie van",
      value(data, "energy"),
    ),
    heading("Opleiding"),
    ...(education.length
      ? education.flatMap((entry, index) => [
          ...(index ? [new Paragraph({ spacing: { after: 100 } })] : []),
          ...field("School of opleider", entry[0]),
          ...field("Opleiding of richting", entry[1]),
          ...field("Status", entry[2]),
        ])
      : [body("Nog niet ingevuld")]),
    heading("Ervaring"),
    ...(experience.length
      ? experience.flatMap((entry, index) => [
          ...(index ? [new Paragraph({ spacing: { after: 100 } })] : []),
          ...field("Bedrijf of organisatie", entry[0]),
          ...field("Functie of soort ervaring", entry[1]),
          ...field("Wat deed je daar", entry[2]),
        ])
      : [body("Nog niet ingevuld")]),
    heading("Extra"),
    ...field("Rijbewijs", value(data, "drivingLicense")),
    ...field("Talen", value(data, "languages")),
    ...field("Certificaten", value(data, "certificates")),
  ];

  const document = new Document({
    creator: "Munks Werkt",
    title: `Cv ${value(data, "name")}`.trim(),
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: "000000" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(document);
  const safeName = (value(data, "name") || "mijn-cv")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${safeName || "mijn-cv"}.docx`;
  link.style.display = "none";
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
