module UI where

import Effects exposing (Effects, Never, none)
import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)
import Maybe exposing (withDefault)
import Signal exposing (Address, Mailbox)
import StartApp exposing (App)
import Task exposing (Task, andThen)


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
  , roads : List Road
  }


type alias Road =
  { toid : String
  , group : String
  , term : Maybe String
  , name : String
  , roadLinks : List String
  }


type alias Feature =
  { tag : String
  , roadNode : Maybe RoadNode
  , roadLink : Maybe RoadLink
  , road : Maybe Road
  }


type alias Model =
  { loadingProgress : Float
  , highlightedFeature : Maybe Feature
  , selectedFeature : Maybe Feature
  }


defaultModel : Model
defaultModel =
  { loadingProgress = 0
  , highlightedFeature = Nothing
  , selectedFeature = Nothing
  }


type Action =
    Idle
  | SetLoadingProgress Float
  | SetHighlightedFeature (Maybe Feature)
  | SetSelectedFeature (Maybe Feature)
  | SendHoveredTOID (Maybe String)
  | SendClickedTOID (Maybe String)


send : Address a -> a -> Effects Action
send address message =
    Effects.task (Signal.send address message `andThen` \_ -> Task.succeed Idle)


update : Action -> Model -> (Model, Effects Action)
update action model =
    case action of
      Idle ->
        (model, none)
      SetLoadingProgress newProgress ->
        ({model | loadingProgress = max 0 newProgress}, none)
      SetHighlightedFeature newFeature ->
        ({model | highlightedFeature = newFeature}, none)
      SetSelectedFeature newFeature ->
        ({model | selectedFeature = newFeature}, none)
      SendHoveredTOID newTOID ->
        (model, send hoveredTOIDMailbox.address newTOID)
      SendClickedTOID newTOID ->
        (model, send clickedTOIDMailbox.address newTOID)


viewTOID : Address Action -> String -> Html
viewTOID address toid =
    a
      [ onClick address (SendClickedTOID (Just toid))
      , onMouseEnter address (SendHoveredTOID (Just toid))
      , onMouseLeave address (SendHoveredTOID Nothing)
      ]
      [text toid]


viewTOIDItem : Address Action -> String -> Html
viewTOIDItem address toid =
    div []
      [ span [] [text "* "]
      , span [] [viewTOID address toid]
      ]


viewTOIDItems : Address Action -> String -> List String -> List Html
viewTOIDItems address label toids =
    if toids == []
      then []
      else
        [ div []
            ( [div [class "ui-feature-key"] [text label]] ++
              List.map (viewTOIDItem address) toids
            )
        ]


viewRoadNode : Address Action -> RoadNode -> Html
viewRoadNode address node =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road Node"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [viewTOID address node.toid]
            ]
        ]
      roadLinks =
        viewTOIDItems address "Road Links: " node.roadLinks
      streetAddress =
        case node.address of
          Nothing ->
            []
          Just addr ->
            [ div []
                [ div [class "ui-feature-key"] [text "Approximate Address: "]
                , div [] [text addr]
                ]
            ]
    in
      div [] (tag ++ toid ++ roadLinks ++ streetAddress)


viewRoadLink : Address Action -> RoadLink -> Html
viewRoadLink address link =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road Link"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [viewTOID address link.toid]
            ]
        ]
      roadNodes =
        case (link.negativeNode, link.positiveNode) of
          (Nothing, Nothing) ->
            []
          (Just neg, Nothing) ->
            [ div []
                [ div [class "ui-feature-key"] [text "Road Nodes: "]
                , div [] [ span [] [text "- "]
                         , viewTOID address neg
                         ]
                ]
            ]
          (Nothing, Just pos) ->
            [ div []
                [ div [class "ui-feature-key"] [text "Road Nodes: "]
                , div [] [ span [] [text "+ "]
                         , viewTOID address pos
                         ]
                ]
            ]
          (Just neg, Just pos) ->
            [ div []
                [ div [class "ui-feature-key"] [text "Road Nodes: "]
                , div [] [ span [] [text "- "]
                         , viewTOID address neg
                         ]
                , div [] [ span [] [text "+ "]
                         , viewTOID address pos
                         ]
                ]
            ]
      description =
        [ div []
            [ div [class "ui-feature-key"] [text "Description: "]
            , div [] [text (link.term ++ ", " ++ link.nature)]
            ]
        ]
      roads =
        if link.roads == []
          then []
          else
            [ div []
                ( [div [class "ui-feature-key"] [text "Roads: "]] ++
                    List.map (viewRoadItem address) link.roads
                )
            ]
    in
      div [] (tag ++ toid ++ roadNodes ++ description ++ roads)


viewRoadItem : Address Action -> Road -> Html
viewRoadItem address road =
    let
      toid =
        [viewTOIDItem address road.toid]
      descriptionText =
        case road.term of
          Nothing ->
            road.name ++ ", " ++ road.group
          Just term ->
            road.name ++ ", " ++ road.group ++ ", " ++ term
      description =
        [ div []
            [ span [] [text "  "]
            , span [] [text descriptionText]
            ]
        ]
    in
      div [] (toid ++ description)


viewRoad : Address Action -> Road -> Html
viewRoad address road =
    let
      tag =
        [div [class "ui-feature-tag"] [text "Road"]]
      toid =
        [ div []
            [ div [class "ui-feature-key"] [text "TOID: "]
            , div [] [viewTOID address road.toid]
            ]
        ]
      name =
        [ div []
            [ div [class "ui-feature-key"] [text "Name: "]
            , div [] [text road.name]
            ]
        ]
      descriptionText =
        case road.term of
          Nothing ->
            road.name ++ ", " ++ road.group
          Just term ->
            road.name ++ ", " ++ road.group ++ ", " ++ term
      description =
        [ div []
            [ div [class "ui-feature-key"] [text "Description: "]
            , div [] [text descriptionText]
            ]
        ]
      roadLinks =
        viewTOIDItems address "Road Links: " road.roadLinks
    in
      div [] (tag ++ toid ++ name ++ description ++ roadLinks)


viewFeature : Address Action -> String -> Maybe Feature -> Html
viewFeature address featureId feature =
    case feature of
      Nothing ->
        div [id featureId, class "ui-feature", style [("display", "none")]] []
      Just f ->
        let
          contents =
            case (f.tag, f.roadNode, f.roadLink, f.road) of
              ("roadNode", Just node, Nothing, Nothing) ->
                [viewRoadNode address node]
              ("roadLink", Nothing, Just link, Nothing) ->
                [viewRoadLink address link]
              ("road", Nothing, Nothing, Just road) ->
                [viewRoad address road]
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


hoveredTOIDMailbox : Mailbox (Maybe String)
hoveredTOIDMailbox =
    Signal.mailbox Nothing


clickedTOIDMailbox : Mailbox (Maybe String)
clickedTOIDMailbox =
    Signal.mailbox Nothing


port hoveredTOID : Signal (Maybe String)
port hoveredTOID =
    hoveredTOIDMailbox.signal


port clickedTOID : Signal (Maybe String)
port clickedTOID =
    clickedTOIDMailbox.signal


port tasks : Signal (Task Never ())
port tasks =
    app.tasks


main : Signal Html
main =
    app.html
