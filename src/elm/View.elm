module View where

import Html exposing (Html, a, div, span, text)
import Html.Attributes exposing (class, id, style)
import Html.Events exposing (onMouseEnter, onMouseLeave, onClick)

import Types exposing (..)


viewWindowTitle : String -> Html
viewWindowTitle title =
    div [class "ui-window-title"] [text title]


viewWindowLabel : String -> Html
viewWindowLabel label =
    div [class "ui-window-label"] [text (label ++ ": ")]


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
    [div [] ([viewWindowLabel label] ++ contents)]


viewLabeledList : String -> (a -> Html) -> List a -> List Html
viewLabeledList label view items =
    case items of
      [] ->
        []
      _ ->
        viewLabeled label (List.map view items)


viewRoadNode : Trigger -> Maybe String -> String -> RoadNode -> Html
viewRoadNode trigger maybeMode titlePrefix roadNode =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road Node")]
      description =
        case roadNode.address of
          Nothing ->
            []
          Just address ->
            viewLabeled "Description" [text address]
      actions =
        case (roadNode.isDeleted, roadNode.isUndeletable) of
          (False, _) ->
            [ div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
                , case maybeMode of
                    Just "routing" ->
                      viewItem "*" (a [onClick trigger (SetMode Nothing)] [text "Stop Routing"])
                    _ ->
                      viewItem "*" (a [onClick trigger (SetMode (Just "routing"))] [text "Start Routing"])
                ]
            ]
          (True, True) ->
            [ div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
                ]
            ]
          _ ->
            []
      toid =
        viewLabeled "TOID" [viewTOID trigger roadNode.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") roadNode.roadLinkTOIDs
    in
      div [] (title ++ description ++ actions ++ toid ++ roadLinks)


viewRoadLinkDescription : RoadLink -> Html
viewRoadLinkDescription roadLink =
    text (roadLink.term ++ ", " ++ roadLink.nature)


viewRoadLink : Trigger -> String -> RoadLink -> Html
viewRoadLink trigger titlePrefix roadLink =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road Link")]
      description =
        viewLabeled "Description" [viewRoadLinkDescription roadLink]
      actions =
        case (roadLink.isDeleted, roadLink.isUndeletable) of
          (False, _) ->
            [ div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
                ]
            ]
          (True, True) ->
            [ div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
                ]
            ]
          _ ->
            []
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
      div [] (title ++ description ++ toid ++ actions ++ roadNodes ++ roads)


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


viewRoad : Trigger -> String -> Road -> Html
viewRoad trigger titlePrefix road =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Road")]
      description =
        viewLabeled "Description" [viewRoadDescription road]
      actions =
        case road.isDeleted of
          False ->
            [ div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger DeleteSelectedFeature] [text "Delete"])
                ]
            ]
          True ->
            [ div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger UndeleteSelectedFeature] [text "Undelete"])
                ]
            ]
      toid =
        viewLabeled "TOID" [viewTOID trigger road.toid]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") road.roadLinkTOIDs
    in
      div [] (title ++ description ++ actions ++ toid ++ roadLinks)


viewRoute : Trigger -> String -> Route -> Html
viewRoute trigger titlePrefix route =
    let
      title =
        [viewWindowTitle (titlePrefix ++ " Route")]
      roadNodes =
        viewLabeled "Road Nodes"
          [ viewTOIDItem trigger "-" route.startNodeTOID
          , viewTOIDItem trigger "+" route.endNodeTOID
          ]
      roadLinks =
        viewLabeledList "Road Links" (viewTOIDItem trigger "*") route.roadLinkTOIDs
    in
      div [] (title ++ roadNodes ++ roadLinks)


viewFeature : Trigger -> Maybe String -> String -> Maybe Feature -> Html
viewFeature trigger maybeMode featureKind maybeFeature =
    let
      featureId =
        if featureKind == "highlighted"
          then "ui-highlighted-feature"
          else "ui-selected-feature"
      titlePrefix =
        if featureKind == "highlighted"
          then "Highlighted"
          else "Selected"
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
                [viewRoadNode trigger maybeMode titlePrefix roadNode]
              ("roadLink", Nothing, Just roadLink, Nothing, Nothing) ->
                [viewRoadLink trigger titlePrefix roadLink]
              ("road", Nothing, Nothing, Just road, Nothing) ->
                [viewRoad trigger titlePrefix road]
              ("route", Nothing, Nothing, Nothing, Just route) ->
                [viewRoute trigger titlePrefix route]
              _ ->
                []
    in
      div ([id featureId, class "ui-window"] ++ display) contents


viewAdjustment : Trigger -> Maybe Adjustment -> Html
viewAdjustment trigger maybeAdjustment =
    let
      isEmpty =
        case maybeAdjustment of
          Nothing ->
            True
          Just adjustment ->
            if adjustment.deletedItemCount == 0
              then True
              else False
      display =
        if isEmpty
          then [style [("display", "none")]]
          else []
      contents =
        case maybeAdjustment of
          Nothing ->
            []
          Just adjustment ->
            [ div [] [viewWindowTitle "Active Adjustment"]
            , div [class "ui-actions"]
                [ viewWindowLabel "Actions"
                , viewItem "*" (a [onClick trigger ClearAdjustment] [text "Clear"])
                ]
            , div [id "ui-deleted-items"]
                ( viewLabeledList "Deleted Road Nodes" (viewTOIDItem trigger "*") adjustment.deletedRoadNodeTOIDs ++
                  viewLabeledList "Deleted Road Links" (viewTOIDItem trigger "*") adjustment.deletedRoadLinkTOIDs ++
                  viewLabeledList "Deleted Roads" (viewTOIDItem trigger "*") adjustment.deletedRoadTOIDs
                )
            ]
    in
      div ([id "ui-adjustment", class "ui-window"] ++ display) contents


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
      , viewFeature trigger state.mode "highlighted" state.highlightedFeature
      , viewFeature trigger state.mode "selected" state.selectedFeature
      , viewAdjustment trigger state.adjustment
      ]
