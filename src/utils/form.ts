export function handleSlInvalid(evt: Event) {
  evt.preventDefault();
	(evt.target as HTMLInputElement).focus();
}

export function handleSubmit(evt: Event) {
  evt.preventDefault();

  const formValues = new FormData(evt.target as HTMLFormElement);
	const values = Object.fromEntries(formValues);

  console.log(values);
}