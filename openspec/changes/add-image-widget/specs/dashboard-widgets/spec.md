# Image Widget Delta

## ADDED Requirements

### Requirement: Image Widget Type
The dashboard system SHALL support an `image` widget type that displays pictures from URLs.

- The widget type enum SHALL include `image` as a valid option
- Image widgets SHALL NOT require a KPI association (unlike other widget types)
- Image widgets SHALL store configuration in the same `config` JSON field as other widgets

#### Scenario: User adds image widget type
Given a user is on the widget picker
When they view the available widget types
Then they see "Image" as an option with icon 🖼️
And the description says "Display a picture or logo"

### Requirement: Image Widget Configuration
The widget picker SHALL provide configuration options for image widgets.

- The configuration step SHALL include a URL input field
- The configuration step SHALL show a live preview of the image
- The configuration step SHALL allow optional alt text for accessibility
- The configuration step SHALL allow object-fit selection (contain, cover, fill)
- The configuration step SHALL allow an optional caption

#### Scenario: User configures image widget
Given a user has selected the image widget type
When they reach the configuration step
Then they see a URL input field
And they see a preview area that updates when URL is entered
And they see optional fields for alt text, object-fit, and caption

#### Scenario: Image preview updates live
Given a user is configuring an image widget
When they enter a valid image URL
Then the preview area displays the image
And they can verify the image before adding the widget

### Requirement: Image Widget Rendering
The dashboard SHALL render image widgets with proper sizing and error handling.

- Image widgets SHALL display within their grid boundaries
- Image widgets SHALL respect the configured object-fit property
- Image widgets SHALL show a loading state while the image loads
- Image widgets SHALL show an error placeholder if the image fails to load
- Image widgets SHALL display the caption below the image if configured
- Image widgets SHALL have a delete button on hover (if user can edit)

#### Scenario: Image widget displays correctly
Given a dashboard has an image widget with a valid URL
When the dashboard is viewed
Then the image is displayed within the widget boundaries
And the image respects the configured object-fit setting

#### Scenario: Image widget handles loading state
Given a dashboard has an image widget
When the image is still loading
Then a loading indicator is shown
And the widget does not appear broken

#### Scenario: Image widget handles error state
Given a dashboard has an image widget with an invalid URL
When the image fails to load
Then an error placeholder is shown with an icon
And a helpful message indicates the image could not load

### Requirement: Image Widget Grid Behavior
Image widgets SHALL follow the same drag-and-drop and resize behavior as other widgets.

- Image widgets SHALL be draggable within the dashboard grid
- Image widgets SHALL be resizable with minimum constraints of 2x2
- Image widgets SHALL have a default size of 4x3 when added

#### Scenario: User resizes image widget
Given a dashboard has an image widget
When the user drags the resize handle
Then the widget resizes within the grid constraints
And the image adjusts to fit the new dimensions

#### Scenario: User drags image widget
Given a dashboard has an image widget
When the user drags the widget using the drag handle
Then the widget repositions within the grid
And other widgets reflow as needed
