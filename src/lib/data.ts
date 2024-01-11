const SERVICES = [
	"Catsitting",
	"Terapia Felina",
	"Terapia Floral",
	"Reiki",
	"Registros Akáshicos",
	"Comunicación telepática con animales",
];

export function getCompanyServices(): string {
	let phrase = "";
	SERVICES.forEach((service, index) => {
		phrase += index < SERVICES.length - 1 ? `${service}, ` : `y ${service}`;
	});

	return phrase;
}
