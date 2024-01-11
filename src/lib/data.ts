const SERVICES = [
	"Catsitting",
	"Terapia Felina",
	"Terapia Floral",
	"Reiki",
	"Registros Akáshicos",
	"Comunicación telepática con animales",
];

export function getCompanyServices() {
	let phrase = "";
	SERVICES.forEach((service, index) => {
		phrase = index < SERVICES.length ? `${service}, ` : `y ${service}`
	})

	return phrase
}
