module UI where

import Effects exposing (Effects, Never)
import Html exposing (Html, a, div, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)
import Maybe exposing (withDefault)
import Signal exposing (Address)
import StartApp exposing (App)
import Task exposing (Task)


type alias RoadNode =
  { toid : String
  , address : Maybe String
  , roadLinks : List String
  }


type alias RoadLink =
  { toid : String
  , term : String
  , nature : String
  , negativeNode : Maybe String
  , positiveNode : Maybe String
  , roads : List String
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  }


type alias Model =
  { loadingProgress : Float
  , highlightedFeature : Maybe Feature
  , selectedFeature : Maybe Feature
  , prevHoveredTOID : Maybe String
  , prevClickedTOID : Maybe String
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , highlightedFeature = Nothing
  , selectedFeature = Nothing
  , prevHoveredTOID = Nothing
  , prevClickedTOID = Nothing
  }


type Action =
    Idle
  | SetLoadingProgress Float
  | SetHighlightedFeature (Maybe Feature)
  | SetSelectedFeature (Maybe Feature)
  | SetPrevHoveredTOID (Maybe String)
  | SetPrevClickedTOID (Maybe String)


noEffect : Model -> (Model, Effects Action)
noEffect model =
    (model, Effects.none)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of
      Idle ->
        noEffect model
      SetLoadingProgress newProgress ->
        noEffect {model | loadingProgress = max 0 newProgress}
      SetHighlightedFeature newFeature ->
        noEffect {model | highlightedFeature = newFeature}
      SetSelectedFeature newFeature ->
        noEffect {model | selectedFeature = newFeature}
      SetPrevHoveredTOID newTOID ->
        noEffect {model | prevHoveredTOID = newTOID}
      SetPrevClickedTOID newTOID ->
        noEffect {model | prevClickedTOID = newTOID}


viewTOID : Address Action -> String -> Html
viewTOID address toid =
    a
      [ onClick address (SetPrevClickedTOID (Just toid))
      , onMouseEnter address (SetPrevHoveredTOID (Just toid))
      , onMouseLeave address (SetPrevHoveredTOID Nothing)
      ]
      [text toid]


viewRoadNode : Address Action -> RoadNode -> Html
viewRoadNode address rn =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road Node"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [viewTOID address rn.toid]
            ]
        ]
      streetAddress =
        [ div []
            [ div [class "ui-feature-key"] [text "Address: "]
            , div [] [text (withDefault "—" rn.address)]
            ]
        ]
      roadLinks =
        [ div []
            ( [div [class "ui-feature-key"] [text "Road Links: "]] ++
              case rn.roadLinks of
                [] ->
                  [div [] [text "—"]]
                _ ->
                  List.concatMap (\toid -> [div [] [viewTOID address toid]]) rn.roadLinks
            )
        ]
    in
      div [] (tag ++ toid ++ streetAddress ++ roadLinks)


viewRoadLink : Address Action -> RoadLink -> Html
viewRoadLink address rl =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road Link"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [viewTOID address rl.toid]
            ]
        ]
      term =
        [ div []
            [ div [class "ui-feature-key"] [text "Term: "]
            , div [] [text rl.term]
            ]
        ]
      nature =
        [ div []
            [ div [class "ui-feature-key"] [text "Nature: "]
            , div [] [text rl.nature]
            ]
        ]
      negativeNode =
        [ div []
            [ div [class "ui-feature-key"] [text "Negative Node: "]
            , case rl.negativeNode of
                Nothing ->
                  div [] [text "—"]
                Just toid ->
                  div [] [viewTOID address toid]
            ]
        ]
      positiveNode =
        [ div []
            [ div [class "ui-feature-key"] [text "Positive Node: "]
            , case rl.positiveNode of
                Nothing ->
                  div [] [text "—"]
                Just toid ->
                  div [] [viewTOID address toid]
            ]
        ]
      roads =
        [ div []
            ( [div [class "ui-feature-key"] [text "Roads: "]] ++
              case rl.roads of
                [] ->
                  [div [] [text "—"]]
                _ ->
                  List.concatMap (\str -> [div [] [text str]]) rl.roads
            )
        ]
    in
      div [] (tag ++ toid ++ term ++ nature ++ positiveNode ++ negativeNode ++ roads)


viewFeature : Address Action -> String -> Maybe Feature -> Html
viewFeature address featureId feature =
    case feature of
      Nothing ->
        div [id featureId, class "ui-feature", style [("display", "none")]] []
      Just f ->
        let
          contents =
            case (f.tag, f.roadNode, f.roadLink) of
              ("roadNode", Just rn, Nothing) ->
                [viewRoadNode address rn]
              ("roadLink", Nothing, Just rl) ->
                [viewRoadLink address rl]
              _ ->
                []
        in
          div [id featureId, class "ui-feature"] contents


view : Address Action -> Model -> Html
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
      , viewFeature address "ui-highlighted-feature" model.highlightedFeature
      , viewFeature address "ui-selected-feature" model.selectedFeature
      ]


init : (Model, Effects Action)
init =
    (defaultModel, Effects.task (Task.succeed Idle))


port setLoadingProgress : Signal Float
port setHighlightedFeature : Signal (Maybe Feature)
port setSelectedFeature : Signal (Maybe Feature)


app : App Model
app =
    StartApp.start
      { init = init
      , update = update
      , view = view
      , inputs =
          [ Signal.map SetLoadingProgress setLoadingProgress
          , Signal.map SetHighlightedFeature setHighlightedFeature
          , Signal.map SetSelectedFeature setSelectedFeature
          ]
      }


port prevHoveredTOID : Signal (Maybe String)
port prevHoveredTOID =
    Signal.map .prevHoveredTOID app.model


port prevClickedTOID : Signal (Maybe String)
port prevClickedTOID =
    Signal.map .prevClickedTOID app.model


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
