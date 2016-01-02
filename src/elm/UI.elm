module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, button, div, input, li, span, text, ul)
import Html.Attributes exposing (id, style)
import Html.Events exposing (onClick)
import Result exposing (Result)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task)

import Common.Maybe exposing (maybe)
import Common.Point exposing (Point)
import Common.Rect
import Common.Quadtree as Quadtree exposing (Quadtree, Item)


---- MODEL ----


type alias Model =
  { left : Float
  , top : Float
  , zoom : Float
  , vertexCount : Int
  , roadNodes : Quadtree String
  , mousePosition : Point
  }


defaultModel : Model
defaultModel =
  { left = 0.4897637424698795
  , top = 0.4768826844262295
  , zoom = 5
  , vertexCount = 0
  , roadNodes = Quadtree.empty 0 0 1048576
  , mousePosition = {x = 0, y = 0}
  }


maxZoom : Float
maxZoom = 7


---- UPDATE ----


type Action =
    Idle
  | SetZoom Float
  | IncreaseZoom
  | DecreaseZoom
  | SetVertexCount Int
  | AddRoadNode (Item String)
  | SetMousePosition Point


noEffect : Model -> (Model, Effects Action)
noEffect model =
    (model, Effects.none)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of 
      Idle ->
        noEffect model
      SetZoom newZoom ->
        {model | zoom = max 0 (min newZoom maxZoom)}
          |> noEffect
      IncreaseZoom ->
        {model | zoom = max 0 (model.zoom - 1)}
          |> noEffect
      DecreaseZoom ->
        {model | zoom = min (model.zoom + 1) maxZoom}
          |> noEffect
      SetVertexCount newCount ->
        {model | vertexCount = max 0 newCount}
          |> noEffect
      AddRoadNode newItem ->
        {model | roadNodes = Quadtree.insert newItem model.roadNodes}
          |> noEffect
      SetMousePosition newPosition ->
        {model | mousePosition = newPosition}
          |> noEffect


---- VIEW ----


view : Address Action -> Model -> Html
view address model =
    let
      loadProgress = toFloat model.vertexCount / toFloat maxVertexCount * 100
      loadDone = model.vertexCount == maxVertexCount
    in
      div []
        [ div
            [ id "ui-load-progress-track"
            , style
                [ ("opacity", if loadDone then "0" else "1")
                ]
            ]
            [ div
              [ id "ui-load-progress-bar"
              , style
                  [ ("width", toString loadProgress ++ "%")
                  ]
              ]
              []
            ]
        ]
      -- [ text loadPercent ]
{-
        [ div []
          [ text ("Left: " ++ toString model.left)
          , button [] [text "⇦"]
          , button [] [text "←"]
          , button [] [text "→"]
          , button [] [text "⇨"]
          ]
        , div []
          [ text ("Top: " ++ toString model.top)
          , button [] [text "⇧"]
          , button [] [text "↑"]
          , button [] [text "↓"]
          , button [] [text "⇩"]
          ]
        , div []
          [ text ("Scale: 1/2^" ++ toString model.zoom)
          , button [onClick address (SetZoom 0)] [text "0"]
          , button [onClick address (SetZoom 1)] [text "1"]
          , button [onClick address (SetZoom 2)] [text "2"]
          , button [onClick address (SetZoom 3)] [text "3"]
          , button [onClick address (SetZoom 4)] [text "4"]
          , button [onClick address (SetZoom 5)] [text "5"]
          , button [onClick address (SetZoom 6)] [text "6"]
          , button [onClick address (SetZoom 7)] [text "7"]
          , button [onClick address (SetZoom 8)] [text "8"]
          , button [onClick address DecreaseZoom] [text "−"]
          , button [onClick address IncreaseZoom] [text "+"]
          ]
        ]
-}


---- INPUTS ----


port maxVertexCount : Int


init : (Model, Effects Action)
init =
    (defaultModel, Task.succeed Idle |> Effects.task)


port setVertexCount : Signal Int
port addRoadNode : Signal (Maybe (Item String))
port setMousePosition : Signal Point


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetVertexCount setVertexCount
          , Signal.map (maybe Idle AddRoadNode) addRoadNode
          , Signal.map SetMousePosition setMousePosition
          ]
      }


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


port left : Signal Float
port left =
    Signal.map .left app.model


port top : Signal Float
port top =
    Signal.map .top app.model


port zoom : Signal Float
port zoom =
    Signal.map .zoom app.model


main : Signal Html
main =
    app.html
