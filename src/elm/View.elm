module View where

import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)

import Types exposing (..)


viewFeatureTag : String -> Html
viewFeatureTag tag =
    div [class "ui-feature-tag"] [text tag]


viewFeatureLabel : String -> Html
viewFeatureLabel label =
    div [class "ui-feature-label"] [text (label ++ ": ")]


viewItem : String -> Html -> Html
viewItem bullet item =
    div []
      [ span [] [text (bullet ++ " ")]
      , span [] [item]
      ]


viewTOID : Trigger -> String -> Html
viewTOID trigger toid =
    a
      [ onClick trigger (SelectFeature (Just toid))
      , onMouseEnter trigger (HighlightFeature (Just toid))
      , onMouseLeave trigger (HighlightFeature Nothing)
      ]
      [text toid]


viewTOIDItem : Trigger -> String -> String -> Html
viewTOIDItem trigger bullet toid =
    viewItem bullet (viewTOID trigger toid)


viewLabeled : String -> List Html -> List Html
viewLabeled label contents =
    [div [] ([viewFeatureLabel label] ++ contents)]


viewLabeledList : String -> (a -> Html) -> List a -> List Html
viewLabeledList label view items =
    case items of
      [] ->
        []
      _ ->
        viewLabeled label (List.map view items)


viewRoadNode : Trigger -> Maybe String -> RoadNode -> Html
viewRoadNode trigger maybeMode roadNode =
    let
      tag =
        [viewFeatureTag "Road Node"]
      description =
        case roadNode.address of
          Nothing ->
            []
          Just address ->
            viewLabeled "Description" [text address]
      actions =
        [ div [class "ui-actions"]
            ( [viewFeatureLabel "Actions"] ++
              case roadNode.isDeleted of
                False ->
                  [ viewItem "*" (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
                  , case maybeMode of
                      Just "routing" ->
                        viewItem "*" (a [onClick trigger (SetMode Nothing)] [text "Stop Routing"])
                      _ ->
                        viewItem "*" (a [onClick trigger (SetMode (Just "routing"))] [text "Start Routing"])
                  ]
                True ->
                  [viewItem "*" (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])]
            )
        ]
      toid =
        viewLabeled "TOID" [viewTOID trigger roadNode.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") roadNode.roadLinkTOIDs
    in
      div [] (tag ++ description ++ actions ++ toid ++ roadLinks)


viewRoadLinkDescription : RoadLink -> Html
viewRoadLinkDescription roadLink =
    text (roadLink.term ++ ", " ++ roadLink.nature)


viewRoadLink : Trigger -> RoadLink -> Html
viewRoadLink trigger roadLink =
    let
      tag =
        [viewFeatureTag "Road Link"]
      description =
        viewLabeled "Description" [viewRoadLinkDescription roadLink]
      actions =
        [ div [class "ui-actions"]
            [ viewFeatureLabel "Actions"
            , case roadLink.isDeleted of
                False ->
                  viewItem "*" (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
                True ->
                  viewItem "*" (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
            ]
        ]
      toid =
        viewLabeled "TOID" [viewTOID trigger roadLink.toid]
      roadNodes =
        case (roadLink.negativeNodeTOID, roadLink.positiveNodeTOID) of
          (Nothing, Nothing) ->
            []
          (Just negativeNodeTOID, Nothing) ->
            viewLabeled "Road Nodes"
              [ viewTOIDItem trigger "-" negativeNodeTOID
              ]
          (Nothing, Just positiveNodeTOID) ->
            viewLabeled "Road Nodes"
              [ viewTOIDItem trigger "+" positiveNodeTOID
              ]
          (Just negativeNodeTOID, Just positiveNodeTOID) ->
            viewLabeled "Road Nodes"
              [ viewTOIDItem trigger "-" negativeNodeTOID
              , viewTOIDItem trigger "+" positiveNodeTOID
              ]
      roads =
        viewLabeledList "Roads" (viewRoadItem trigger) roadLink.roads
    in
      div [] (tag ++ description ++ toid ++ actions ++ roadNodes ++ roads)


viewRoadDescription : Road -> Html
viewRoadDescription road =
    case road.term of
      Nothing ->
        text (road.name ++ ", " ++ road.group)
      Just term ->
        text (road.name ++ ", " ++ road.group ++ ", " ++ term)


viewRoadItem : Trigger -> Road -> Html
viewRoadItem trigger road =
    let
      toid =
        [viewTOIDItem trigger "*" road.toid]
      description =
        [viewItem " " (viewRoadDescription road)]
    in
      div [] (toid ++ description)


viewRoad : Trigger -> Road -> Html
viewRoad trigger road =
    let
      tag =
        [viewFeatureTag "Road"]
      description =
        viewLabeled "Description" [viewRoadDescription road]
      toid =
        viewLabeled "TOID" [viewTOID trigger road.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") road.roadLinkTOIDs
    in
      div [] (tag ++ description ++ toid ++ roadLinks)


viewRoute : Trigger -> Route -> Html
viewRoute trigger route =
    let
      tag =
        [viewFeatureTag "Route"]
      roadNodes =
        viewLabeled "Road Nodes"
          [ viewTOIDItem trigger "-" route.startNodeTOID
          , viewTOIDItem trigger "+" route.endNodeTOID
          ]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") route.roadLinkTOIDs
    in
      div [] (tag ++ roadNodes ++ roadLinks)


viewFeature : Trigger -> Maybe String -> String -> Maybe Feature -> Html
viewFeature trigger maybeMode featureId maybeFeature =
    let
      display =
        if maybeFeature == Nothing
          then [style [("display", "none")]]
          else []
      contents =
        case maybeFeature of
          Nothing ->
            []
          Just feature ->
            case (feature.tag, feature.roadNode, feature.roadLink, feature.road, feature.route) of
              ("roadNode", Just roadNode, Nothing, Nothing, Nothing) ->
                [viewRoadNode trigger maybeMode roadNode]
              ("roadLink", Nothing, Just roadLink, Nothing, Nothing) ->
                [viewRoadLink trigger roadLink]
              ("road", Nothing, Nothing, Just road, Nothing) ->
                [viewRoad trigger road]
              ("route", Nothing, Nothing, Nothing, Just route) ->
                [viewRoute trigger route]
              _ ->
                []
    in
      div ([id featureId, class "ui-feature"] ++ display) contents


viewLoadingProgress : Float -> Html
viewLoadingProgress loadingProgress =
    let
      opacity =
        if loadingProgress == 100
          then [style [("opacity", "0")]]
          else []
    in
      div ([id "ui-loading-progress-track"] ++ opacity)
        [ div
            [ id "ui-loading-progress-bar"
            , style [("width", toString loadingProgress ++ "%")]
            ]
            []
        ]


view : Trigger -> State -> Html
view trigger state =
    div []
      [ viewLoadingProgress state.loadingProgress
      , viewFeature trigger state.mode "ui-highlighted-feature" state.highlightedFeature
      , viewFeature trigger state.mode "ui-selected-feature" state.selectedFeature
      ]
