module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, div, span, text)
import Html.Attributes exposing (id, style)
import StartApp exposing (App)
import Task exposing (Task)


type alias Point =
  { x : Float
  , y : Float
  }

type alias Address =
  { toid : String
  , lat : Float
  , lng : Float
  , addr : String
  }

type alias Model =
  { loadingProgress : Float
  , hoveredLocation : Point
  , hoveredAnchor : Maybe Point
  , hoveredToid : Maybe String
  , hoveredAddress : Maybe Address
  , selectedLocation : List Point
  , selectedAnchor : Maybe Point
  , selectedToid : Maybe String
  , selectedAddress : Maybe Address
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , hoveredLocation = {x = 0, y = 0}
  , hoveredAnchor = Nothing
  , hoveredToid = Nothing
  , hoveredAddress = Nothing
  , selectedLocation = []
  , selectedAnchor = Nothing
  , selectedToid = Nothing
  , selectedAddress = Nothing
  }


type Action =
    Idle
  | SetLoadingProgress Float
  | SetHoveredLocation Point
  | SetHoveredAnchor (Maybe Point)
  | SetHoveredToid (Maybe String)
  | SetHoveredAddress (Maybe Address)
  | SetSelectedLocation (List Point)
  | SetSelectedAnchor (Maybe Point)
  | SetSelectedToid (Maybe String)
  | SetSelectedAddress (Maybe Address)


noEffect : Model -> (Model, Effects Action)
noEffect model =
    (model, Effects.none)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of
      Idle ->
        noEffect model
      SetLoadingProgress newProgress ->
        {model | loadingProgress = max 0 newProgress}
          |> noEffect
      SetHoveredLocation newLocation ->
        {model | hoveredLocation = newLocation}
          |> noEffect
      SetHoveredAnchor newAnchor ->
        {model | hoveredAnchor = newAnchor}
          |> noEffect
      SetHoveredToid newToid ->
        {model | hoveredToid = newToid}
          |> noEffect
      SetHoveredAddress newAddress ->
        {model | hoveredAddress = newAddress}
          |> noEffect
      SetSelectedLocation newLocation ->
        {model | selectedLocation = newLocation}
          |> noEffect
      SetSelectedAnchor newAnchor ->
        {model | selectedAnchor = newAnchor}
          |> noEffect
      SetSelectedToid newToid ->
        {model | selectedToid = newToid}
          |> noEffect
      SetSelectedAddress newAddress ->
        {model | selectedAddress = newAddress}
          |> noEffect


viewPoint : Point -> String
viewPoint p =
    toString (round p.x) ++ " " ++ toString (round p.y)


viewLegend : String -> Maybe String -> Maybe Address -> Html
viewLegend legendId maybeToid maybeAddress =
    let
      toidPart =
        case maybeToid of
          Nothing ->
            []
          Just toid ->
            [div [] [text toid]]
      addressPart =
        case maybeAddress of
          Nothing ->
            []
          Just address ->
            [ div [] [text (toString address.lat ++ " " ++ toString address.lng)]
            , div [] [text address.addr]
            ]
    in
      div
        [ id legendId
        , style [("opacity", if maybeToid == Nothing then "0" else "1")]
        ]
        (toidPart ++ addressPart)


view : Signal.Address Action -> Model -> Html
view address model =
    div []
      [ div
          [ id "ui-loading-progress-track"
          , style [("opacity", if model.loadingProgress == 100 then "0" else "1")]
          ]
          [ div
            [ id "ui-loading-progress-bar"
            , style [("width", toString model.loadingProgress ++ "%")]
            ]
            []
          ]
      , div
          [ id "ui-status-area"
          ]
          [ span [id "ui-status-left"]
              []
          , span [id "ui-status-right"]
              []
          ]
      , viewLegend "ui-hovered-legend" model.hoveredToid model.hoveredAddress
      , viewLegend "ui-selected-legend" model.selectedToid model.selectedAddress
      ]


init : (Model, Effects Action)
init =
    (defaultModel, Task.succeed Idle |> Effects.task)


port setLoadingProgress : Signal Float
port setHoveredLocation : Signal Point
port setHoveredAnchor : Signal (Maybe Point)
port setHoveredToid : Signal (Maybe String)
port setHoveredAddress : Signal (Maybe Address)
port setSelectedLocation : Signal (List Point)
port setSelectedAnchor : Signal (Maybe Point)
port setSelectedToid : Signal (Maybe String)
port setSelectedAddress : Signal (Maybe Address)


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetLoadingProgress setLoadingProgress
          , Signal.map SetHoveredLocation setHoveredLocation
          , Signal.map SetHoveredAnchor setHoveredAnchor
          , Signal.map SetHoveredToid setHoveredToid
          , Signal.map SetHoveredAddress setHoveredAddress
          , Signal.map SetSelectedLocation setSelectedLocation
          , Signal.map SetSelectedAnchor setSelectedAnchor
          , Signal.map SetSelectedToid setSelectedToid
          , Signal.map SetSelectedAddress setSelectedAddress
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
