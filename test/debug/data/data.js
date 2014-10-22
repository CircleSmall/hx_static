module.exports = {
	"address": [{
		"street": "John",
		"city": "Lennon"
	}, {
		"street": "Paul",
		"city": "McCartney"
	}, {
		"street": "George",
		"city": "Harrison"
	}, {
		"street": "Ringo",
		"city": "Starr"
	}],
	"name": function() {
		return this.firstName + " " + this.lastName;
	}
}