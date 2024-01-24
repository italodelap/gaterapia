const listItem = document.querySelectorAll("header ul li");
const navbarBackdrop = document.querySelector("#navbar-backdrop") as HTMLElement;

listItem.forEach((item) => {
	item.addEventListener("mouseenter", () => {
		const { left, top, width, height } = item.getBoundingClientRect();

		navbarBackdrop.style.setProperty("--left", `${left}px`);
		navbarBackdrop.style.setProperty("--top", `${top}px`);
		navbarBackdrop.style.setProperty("--width", `${width}px`);
		navbarBackdrop.style.setProperty("--height", `${height}px`);

		navbarBackdrop.style.opacity = "1";
		navbarBackdrop.style.visibility = "visible";
	});

	item.addEventListener("mouseleave", () => {
		navbarBackdrop.style.opacity = "0";
		navbarBackdrop.style.visibility = "hidden";
	});
});
