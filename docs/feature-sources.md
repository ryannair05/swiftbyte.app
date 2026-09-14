# Website feature sources

Reviewed September 7, 2026 against `/Users/ryannair/Developer/Penn-State-Meals`.

| Website content | App evidence |
| --- | --- |
| Five PSU halls; My Meals, PSU Eats, Campus Rec, Nearby Restaurants, Meet | `Penn State Meals/Dining/DiningHallListViewController.swift`, including `applySnapshot` and `didSelectRowAt` |
| Dates, meals, menu rows and dietary filters | `Penn State Meals/MealsViewController.swift`, `Dining/MenuPresentationSnapshot.swift` |
| Dish macros, ingredients, allergens | `Dining/MenuItemDetailViewController.swift`, `Dining/NutritionFactsCardView.swift` |
| Plate building, history, charts, exports, Health permissions | `Dining/MyMeals/MyMealsView.swift`, `PlateDraft.swift`, `MealJournal.swift` |
| Pro gating and saved-meal access after expiry | `Preferences/ProContent.swift`, `Dining/MyMeals/MyMealsView.swift` |
| CATA routes, map vehicles, stop departures | `CATA/KMLViewerViewController.m`, `RouteListViewController.m`, `StopsPopupViewController.m` |
| BTChat and current tab structure | `ContentView.swift` |
| Social Meet remains under Other Locations | `Dining/DiningHallListViewController.swift`, `Meet/MeetView.swift` |
| Home Screen widgets | `Meals Widget/MealsWidget.swift`, `WidgetMealParser.swift` |
| Siri/Shortcuts | `GetDiningMenuIntent.swift` |
| App icon | Existing supplied app artwork in `AppIcon.png`; the experimental SVG is no longer displayed |

Store availability and iOS 17 requirement were checked against:
- https://apps.apple.com/us/app/meet-and-eat-campus-dining/id6446225508
- https://play.google.com/store/apps/details?id=com.ryannair05.meetandeat

No fabricated testimonials, user counts, live arrival times, or current menu availability are presented. PSU-specific features are distinguished from dining support at Barnard and UGA. Published nutrition is not described as an allergy-safety guarantee. Screenshots are examples, not a live feed.
