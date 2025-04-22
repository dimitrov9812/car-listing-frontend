// Define Car interfaces (you can move this to a separate model file)
export interface Publisher {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string;
    address: string;
    profilePicture: string;
}

export interface Car {
id?: string;
make: string;
model: string;
datePublished?: string;
type: string;
features: { [key: string]: boolean };
pictures: string[];
publisher: Publisher;
}