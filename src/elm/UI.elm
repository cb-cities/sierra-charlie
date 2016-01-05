module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, div, span, text)
import Html.Attributes exposing (id, style)
import Signal exposing (Address)
import StartApp exposing (App)
import Task exposing (Task)


type alias Point =
  { x : Float
  , y : Float
  }

type alias Model =
  { loadingProgress : Float
  , hoveredLocation : Point
  , hoveredAnchor : Maybe Point
  , hoveredToid : Maybe String
  , selectedLocation : List Point
  , selectedAnchor : Maybe Point
  , selectedToid : Maybe String
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , hoveredLocation = {x = 0, y = 0}
  , hoveredAnchor = Nothing
  , hoveredToid = Nothing
  , selectedLocation = []
  , selectedAnchor = Nothing
  , selectedToid = Nothing
  }


type Action =
    Idle
  | SetLoadingProgress Float
  | SetHoveredLocation Point
  | SetHoveredAnchor (Maybe Point)
  | SetHoveredToid (Maybe String)
  | SetSelectedLocation (List Point)
  | SetSelectedAnchor (Maybe Point)
  | SetSelectedToid (Maybe String)


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
      SetSelectedLocation newLocation ->
        {model | selectedLocation = newLocation}
          |> noEffect
      SetSelectedAnchor newAnchor ->
        {model | selectedAnchor = newAnchor}
          |> noEffect
      SetSelectedToid newToid ->
        {model | selectedToid = newToid}
          |> noEffect


viewPoint : Point -> String
viewPoint p =
    toString (round p.x) ++ " " ++ toString (round p.y)


view : Address Action -> Model -> Html
view address model =
    div []
      [ div
          [ id "ui-loading-progress-track"
          , style
              [ ("opacity", if model.loadingProgress == 100 then "0" else "1")
              ]
          ]
          [ div
            [ id "ui-loading-progress-bar"
            , style
                [ ("width", toString model.loadingProgress ++ "%")
                ]
            ]
            []
          ]
      , div
          [ id "ui-status-area"
          ]
          [ span [id "ui-status-left"]
              [ let
                  location = viewPoint (model.hoveredLocation)
                  toid =
                    case model.hoveredToid of
                      Nothing ->
                        ""
                      Just toid ->
                        toid
                in
                  text (location ++ " " ++ toid)
              ]
          , span [id "ui-status-right"]
              [ let
                  location = List.foldl (\p s -> viewPoint p ++ "\n" ++ s) "" model.selectedLocation
                  toid =
                    case model.selectedToid of
                      Nothing ->
                        ""
                      Just toid ->
                        toid
                in
                  text (location ++ " " ++ toid)
              ]
          ]
      , div
          [ id "ui-hovered-legend"
          , style
              [ ("opacity", if model.hoveredAnchor == Nothing then "0" else "1")
              , ("left", "100px")
              , ("top", "100px")
              ]
          ]
          [ text "hovered legend"
          ]
      , div
          [ id "ui-selected-legend"
          , style
              [ ("opacity", if model.selectedAnchor == Nothing then "0" else "1")
              , ("left", "200px")
              , ("top", "200px")
              ]
          ]
          [ text "selected legend"
          ]
      ]


init : (Model, Effects Action)
init =
    (defaultModel, Task.succeed Idle |> Effects.task)


port setLoadingProgress : Signal Float
port setHoveredLocation : Signal Point
port setHoveredAnchor : Signal (Maybe Point)
port setHoveredToid : Signal (Maybe String)
port setSelectedLocation : Signal (List Point)
port setSelectedAnchor : Signal (Maybe Point)
port setSelectedToid : Signal (Maybe String)


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
          , Signal.map SetSelectedLocation setSelectedLocation
          , Signal.map SetSelectedAnchor setSelectedAnchor
          , Signal.map SetSelectedToid setSelectedToid
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
