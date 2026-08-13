Hotel API Integration Guide
The OS-TRAVEL Hotel API enables third-party systems to connect to the OS-TRAVEL Hotel ERP. Partners can synchronize hotel catalog data, search availability and rates, create and manage bookings, and retrieve reservation history.

Integration Flow
1
Sync Static Data
ListCountry, ListCity, ListBoarding, ListCategorie, ListCurrency, ListHotel, HotelDetail.

2
Search Availability
HotelSearch with dates, hotel Ids (max 200), and room occupancy.

3
Pre-book
BookingCreation with PreBooking=true to verify without saving.

4
Confirm Booking
BookingCreation without PreBooking (defaults to direct booking).

5
Manage Bookings
BookingList and BookingCancellation.

Quick Start Endpoints
HotelSearch
Search availability & rates
BookingCreation
Create reservations
BookingList
Retrieve booking history
Purpose
This document provides the technical reference required to integrate with the OS-TRAVEL Hotel API.

Technical Prerequisites
HTTPS connectivity (TLS 1.2 or higher)
UTF-8 encoding for all requests and responses
Ability to send and parse JSON payloads
Server capable of storing static reference data locally
Secure storage of API credentials (Login / Password)
Integration Sequence
Partner
OS-TRAVEL API
Request
Credential (Login/Password)
Response
Static data (cities, hotels)
Request
HotelSearch (criteria)
Response
Hotels + Token + Prices
Request
BookingCreation (PreBook)
Response
Price / availability confirmed
Request
BookingCreation (confirm)
Response
Booking Id + details
Authentication & Conventions
Connect securely to the OS-TRAVEL Hotel API.

Important: Each partner receives their own BASE_URL by email from OS-TRAVEL. Replace [BASE_URL] below with the value provided to you.

Base URL
[BASE_URL]/api/hotel
Example: [BASE_URL]/api/hotel

Request Format
Field	Required	Type	Description
HTTP Method	Required	—	POST (all endpoints)
Content-Type	Required	string	application/json
Accept	Required	string	application/json
Body	Required	object	JSON with Credential and method-specific fields
Authentication
Every request must include a Credential object issued by OS-TRAVEL.

Field	Required	Type	Description
Credential	Required	object	Authentication container
Credential.Login	Required	string	Partner login provided by OS-TRAVEL
Credential.Password	Required	string	Partner password provided by OS-TRAVEL
JSON

Copy
{
  "Credential": {
    "Login": "partner_login",
    "Password": "partner_password"
  }
}
Date & Time Formats
Format	Pattern	Usage
Date	YYYY-MM-DD	CheckIn, CheckOut, FromDate, ToDate
DateTime	YYYY-MM-DD HH24:MI	Created, Validated, Cancelled
Enumerated Values
Field	Type	Values
State	string	OnRequest | Validated | Cancelled
CancellationPolicy.Type	string	PERCENT | NIGHT | PRICE
CancellationPolicy.Nature	string	NO_SHOW | PREMATURE_DEPARTURE | BEFORE_ARRIVAL | NON_REFUNDABLE
Common Data Models
Reusable objects referenced across multiple endpoints.

Credential
Field	Required	Type	Description
Login	Required	string	Partner login
Password	Required	string	Partner password
Country
Field	Required	Type	Description
Id	Required	int	Country unique identifier
Code	Required	string	ISO country code (e.g. dz, tn)
Name	Required	string	Country name
City
Field	Required	Type	Description
Id	Required	int	City unique identifier
Name	Required	string	City name
Country	Optional	string	Country name (HotelDetail context)
Region	Optional	string	Region name (optional)
ShortDescription	Optional	string	Short description
Address	Optional	string	City or hotel address
Category
Field	Required	Type	Description
Id	Required	int	Category unique identifier
Star	Optional	int|null	Star rating (null for non-star categories)
Title	Required	string	Category label (e.g. 3 étoiles, Campement)
Localization
Field	Required	Type	Description
Longitude	Required	string	Longitude
Latitude	Required	string	Latitude
Facility
Field	Required	Type	Description
Title	Required	string	Facility name
Category	Required	string	Facility category
Boarding
Field	Required	Type	Description
Id	Required	int	Boarding Id
Code	Required	string	Short code (BB, HB)
Name	Required	string	Full name
Description	Optional	string|null	Boarding description (optional)
Pax
Field	Required	Type	Description
Adult	Required	int / array	Adults count or details
Child	Optional	array(int)	Children ages or details
AdultPassenger
Field	Required	Type	Description
Civility	Required	string	Mr, Mrs, Ms
Name	Required	string	First name
Surname	Required	string	Last name
Holder	Required	boolean	Booking holder flag
NumeroPasseport	Optional	string|null	Passport number (response)
DateExpirationPasseport	Optional	string|null	Passport expiry (response)
DateNaissance	Optional	string|null	Date of birth (response)
RestePayerBus	Optional	string|null	Remaining bus payment (response)
ChildPassenger
Field	Required	Type	Description
Name	Required	string	First name
Surname	Required	string	Last name
Age	Required	int|string	Child age
NumeroPasseport	Optional	string|null	Passport number (response)
DateExpirationPasseport	Optional	string|null	Passport expiry (response)
DateNaissance	Optional	string|null	Date of birth (response)
RestePayerBus	Optional	string|null	Remaining bus payment (response)
CancellationPolicy
Field	Required	Type	Description
Fees	Required	int|string	Fee amount
Type	Required	string	PERCENT | NIGHT | PRICE
Nature	Required	string	NO_SHOW | PREMATURE_DEPARTURE | BEFORE_ARRIVAL | NON_REFUNDABLE
Description	Optional	string	Human-readable policy text
FromDate	Optional	string	Effective from (DD-MM-YYYY HH:mm or DD/MM/YYYY HH:mm)
Voucher
Field	Required	Type	Description
Num	Required	string	Voucher number
Url	Required	string	Voucher download URL
StopSales
Field	Required	Type	Description
Title	Required	string	Period title
FromDate	Required	string	Start date
ToDate	Required	string	End date
Promotion
Field	Required	Type	Description
Title	Required	string	Title
Description	Required	string	Description
Rate	Required	decimal	Discount rate
Supplement
Field	Required	Type	Description
Id	Required	int	Supplement Id
Name	Required	string	Name
Price	Required	decimal	Price
Required	Optional	boolean	Mandatory flag
View
Field	Required	Type	Description
Id	Required	int	View Id
Name	Required	string	View name
Option
Field	Required	Type	Description
Id	Required	int	Option Id
Title	Required	string	Option title
Tag
Field	Required	Type	Description
Id	Required	int	Tag Id
Title	Required	string	Tag label
Image	Optional	string	Tag image path or URL
API Endpoint Reference
All endpoints use POST with application/json.

Static Data Methods
Synchronize and store static reference data before searching availability. On error, responses follow the standard envelope documented in Error Handling.

API
/
Static Data Methods
/
ListCountry
ListCountry
POST
[BASE_URL]/api/hotel/ListCountry
Retrieves available countries.

Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Next
ListCity
API
/
Static Data Methods
/
ListCity
ListCity
POST
[BASE_URL]/api/hotel/ListCity
Retrieves available cities.

Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Country	Required	int	Country Id (from ListCountry)
Previous
ListCountry
Next
ListBoarding
API
/
Static Data Methods
/
ListBoarding
ListBoarding
POST
[BASE_URL]/api/hotel/ListBoarding
Retrieves boarding types (meal plans).

Key points
On error, see Error Handling — the boarding list is not returned (ListBoarding: null).
Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Previous
ListCity
Next
ListCategorie
API
/
Static Data Methods
/
ListCategorie
ListCategorie
POST
[BASE_URL]/api/hotel/ListCategorie
Retrieves hotel categories (star ratings and accommodation types).

Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Previous
ListBoarding
Next
ListCurrency
API
/
Static Data Methods
/
ListCurrency
ListCurrency
POST
[BASE_URL]/api/hotel/ListCurrency
Retrieves supported currencies.

Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Previous
ListCategorie
Next
ListHotel
API
/
Static Data Methods
/
ListHotel
ListHotel
POST
[BASE_URL]/api/hotel/ListHotel
Retrieves hotel catalog for a given city.

Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
City	Required	int	City Id (from ListCity)
Previous
ListCurrency
Next
HotelDetail
API
/
Static Data Methods
/
HotelDetail
HotelDetail
POST
[BASE_URL]/api/hotel/HotelDetail
Retrieves detailed hotel information (description, photos, options, tags, boardings).

Key points
On error, see Error Handling — HotelDetail is null.
Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Hotel	Required	int	Hotel Id (from ListHotel)
Previous
ListHotel
Next
HotelSearch
Booking Methods
Transactional methods for search, booking, cancellation, and history.

API
/
Booking Methods
/
HotelSearch
HotelSearch
POST
[BASE_URL]/api/hotel/HotelSearch
Searches availability and rates for a list of hotels by Id. Returns a Token per hotel for booking.

Key points
Search is by hotel Id list only (Hotels) — not by city. Use ListHotel to obtain hotel Ids.
Maximum 200 hotel Ids per search request.
Hotels with no available rates are omitted from HotelSearch (not returned).
Each result includes its own Token and Source — both are required for BookingCreation.
Source identifies the supplier chain when offers pass through multiple XML levels or consecutive providers.
Prices are returned as decimal strings (e.g. "927.520"), not numbers.
StopReservation=true means the hotel is in stop sales; booking is not allowed for that rate.
On error, see Error Handling — HotelSearch is null.
Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
SearchDetails	Required	object	Search criteria container
SearchDetails.BookingDetails	Required	object	Stay dates and hotel list
SearchDetails.BookingDetails.CheckIn	Required	string	Check-in date (YYYY-MM-DD)
SearchDetails.BookingDetails.CheckOut	Required	string	Check-out date (YYYY-MM-DD)
SearchDetails.BookingDetails.Hotels	Required	array(int)	Hotel Ids from ListHotel (required; max 200 per request)
SearchDetails.Filters	Optional	object	Optional search filters
SearchDetails.Filters.Category	Optional	array(int)	Category Ids from ListCategorie (empty = no filter)
SearchDetails.Filters.OnlyAvailable	Optional	boolean	Return only available hotels when true
SearchDetails.Rooms	Required	array	Room occupancy (one object per room)
SearchDetails.Rooms[].Adult	Required	int	Number of adults in the room
SearchDetails.Rooms[].Child	Optional	array(int)	Children ages in the room
Previous
HotelDetail
Next
BookingCreation
API
/
Booking Methods
/
BookingCreation
BookingCreation
POST
[BASE_URL]/api/hotel/BookingCreation
Creates or confirms a reservation. Omit PreBooking (or set false) to book directly; set PreBooking=true to verify price and availability without saving.

Key points
Token and Source must match the HotelSearch result used for the selected rate.
Use PreBooking=true first to validate price and availability; response matches final booking but without Id or Voucher. Then confirm without PreBooking.
Room Ids, Boarding and passenger details must match the selected offer from HotelSearch.
On error, see Error Handling — BookingCreation is null.
Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
HotelBooking	Required	object	Booking container
HotelBooking.City	Required	int	City Id
HotelBooking.Hotel	Required	int	Hotel Id
HotelBooking.CheckIn	Required	string	Check-in date (YYYY-MM-DD)
HotelBooking.CheckOut	Required	string	Check-out date (YYYY-MM-DD)
HotelBooking.Source	Required	string	Source from HotelSearch — identifies the supplier chain for this offer
HotelBooking.Rooms	Required	array	One object per room from the search
HotelBooking.Rooms[].Id	Required	int|string	Room type Id from HotelSearch
HotelBooking.Rooms[].Boarding	Required	int	Boarding Id from HotelSearch
HotelBooking.Rooms[].View	Optional	array(int)	View Ids (empty array if none)
HotelBooking.Rooms[].Supplement	Optional	array(int)	Supplement Ids (empty array if none)
HotelBooking.Rooms[].Pax	Required	object	Passengers for this room
HotelBooking.Rooms[].Pax.Adult	Required	array	Adult passengers (see AdultPassenger)
HotelBooking.Rooms[].Pax.Adult[].Civility	Required	string	Mr, Mrs, Ms
HotelBooking.Rooms[].Pax.Adult[].Name	Required	string	First name
HotelBooking.Rooms[].Pax.Adult[].Surname	Required	string	Last name
HotelBooking.Rooms[].Pax.Adult[].Holder	Required	boolean	Booking holder (one adult per booking must be true)
HotelBooking.Rooms[].Pax.Child	Optional	array	Child passengers (see ChildPassenger)
HotelBooking.Rooms[].Pax.Child[].Name	Required	string	First name
HotelBooking.Rooms[].Pax.Child[].Surname	Required	string	Last name
HotelBooking.Rooms[].Pax.Child[].Age	Required	int|string	Child age
HotelBooking.Comment	Optional	string	Optional booking comment
HotelBooking.Token	Required	string	Token from HotelSearch (selected hotel result)
HotelBooking.PreBooking	Optional	boolean	Optional. true = verify only (no save). Omitted or false = create booking directly (default: false). Response has the same structure but without Booking Id or Voucher.
Previous
HotelSearch
Next
BookingCancellation
API
/
Booking Methods
/
BookingCancellation
BookingCancellation
POST
[BASE_URL]/api/hotel/BookingCancellation
Cancels a reservation. Fees may apply.

Key points
Use PreCancelled=true first to preview fees.
Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Booking	Required	int	Booking Id
PreCancelled	Optional	boolean	Simulate cancellation
Previous
BookingCreation
Next
BookingList
API
/
Booking Methods
/
BookingList
BookingList
POST
[BASE_URL]/api/hotel/BookingList
Retrieves reservation history. Each result has the same structure as a BookingCreation response.

Key points
Empty filter and paginator values can be sent as empty strings.
For the full field list per booking, see BookingCreation response definition.
On error, see Error Handling — BookingList is null.
Request
Response
Examples
Field	Required	Type	Description
Credential	Required	object	Authentication (see Authentication section)
Credential.Login	Required	string	Partner login
Credential.Password	Required	string	Partner password
Filters	Optional	object	Filter criteria (empty string = no filter)
Filters.Booking	Optional	string|int	Booking Id filter (empty string if not used)
Filters.Hotel	Optional	string|int	Hotel Id filter (empty string if not used)
Filters.FromDate	Optional	string	Creation from date YYYY-MM-DD (empty string if not used)
Filters.ToDate	Optional	string	Creation to date YYYY-MM-DD (empty string if not used)
Paginator	Optional	object	Pagination (empty strings = defaults)
Paginator.Page	Optional	string|int	Page number (empty string if not used)
Paginator.CountPerPage	Optional	string|int	Results per page (empty string if not used)
Previous
BookingCancellation
Next
ListCountry
Error Handling
All endpoints share the same error response envelope. Check ErrorMessage.Code and ErrorMessage.Description to handle failures in your integration.

List* endpoints: For List* methods (ListCountry, ListCity, ListBoarding, ListCategorie, ListCurrency, ListHotel…), the main result field is null on error (e.g. ListCategorie: null) and CountResults is 0. Timing and Ip may be present but are optional metadata.

HTTP Status Codes
Code	Name	Description
200	Success	Request processed; check ErrorMessage is empty or absent
400	Bad Request	Invalid parameters, malformed JSON, or missing login/password
401	Unauthorized	Invalid or missing credentials
404	Not Found	Resource not found
409	Conflict	Price or availability changed
500	Internal Server Error	Unexpected server error
Error Response Fields
Field	Required	Type	Description
List{MethodName}	Optional	array|null	Main result array; null when an error occurred (List* endpoints only)
CountResults	Optional	int	Number of results; 0 on error (optional, may be removed in future)
ErrorMessage	Required	object	Error details when the request fails
ErrorMessage.Code	Required	int	Error code (e.g. 400, 401)
ErrorMessage.Description	Required	string	Human-readable error message
Timing	Optional	object	Request timing metadata (optional)
Ip	Optional	string	Client IP address (optional)
Example Error Response
JSON — ListCategorie (invalid credentials)

Copy
{
  "ListCategorie": null,
  "CountResults": 0,
  "ErrorMessage": {
    "Code": 400,
    "Description": "Check the sending of the login and password"
  },
  "Timing": {
    "Begin": {
      "date": "2026-07-03 02:28:28.342512",
      "timezone_type": 3,
      "timezone": "Africa/Tunis"
    },
    "End": {
      "date": "2026-07-03 02:28:28.342682",
      "timezone_type": 3,
      "timezone": "Africa/Tunis"
    },
    "Duration": "0 ms"
  },
  "Ip": "102.211.211.160"
}
Glossary
Term	Definition
Pax	Passengers for a room — object with Adult[] and Child[] arrays (BookingCreation request and response).
Boarding	Meal plan / board basis (e.g. Room Only, B&B, Half Board, All Inclusive). Retrieved via ListBoarding.
Token	Session token returned per hotel in HotelSearch. Required in BookingCreation together with Source.
Source	Supplier chain identifier returned by HotelSearch; must be passed back in BookingCreation (pre-book and confirm).
PreBooking	When true, BookingCreation verifies price and availability without saving. Response is the same structure but without booking Id or Voucher. Omitted or false = direct booking.
PreCancelled	When true on BookingCancellation, simulates cancellation and returns fees without cancelling the booking.
StopReservation	When true on a room rate in HotelSearch, the hotel is in stop sales and booking is not allowed for that rate.
OnRequest	Booking awaiting hotel confirmation — State is OnRequest, or OnRequest=true on the BookingCreation response.
Supplement	Optional add-on selected per room in BookingCreation (empty array if none).
CancellationPolicy	Rules and fees for cancellation or modification (Types PERCENT, NIGHT, PRICE; Natures include NON_REFUNDABLE, BEFORE_ARRIVAL, NO_SHOW, PREMATURE_DEPARTURE).
Tag	Hotel label or highlight (Id, Title, Image) returned in HotelDetail for display or filtering.
Version History
Version	Date	Description
2.0	June 2026	Professional integration guide — HTML + Word
1.0	—	Initial PDF documentation
Technical Support
For integration support, contact OS-TRAVEL:

Email: support@octasoft.com.tn
Subject: [Partner Name] — Hotel API Integration
Include: endpoint called, request payload, response received, and timestamp