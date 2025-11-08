#!/bin/bash

# API base URL
API_URL="http://ch-alb-2140286266.us-east-1.elb.amazonaws.com/api/v1/pricing"

echo "Inserting test products via API..."
echo ""

# Product data array
declare -a products=(
    '{"code":"825","name_sl":"Pečene pileće trakice zabatka","name_hr":"Pečene pileće trakice zabatka","unit":"kg","industry_code":"meat-products","lc":3.173,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"36851","name_sl":"Makrelen Provencale 125g, GER/si/de/at/it","name_hr":"Makrelen Provencale 125g, GER/si/de/at/it","unit":"kos","industry_code":"delamaris","lc":0.7738,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"36875","name_sl":"Makrelenfilets in Olivenöl 125g, GER/de/at","name_hr":"Makrelenfilets in Olivenöl 125g, GER/de/at","unit":"kos","industry_code":"delamaris","lc":1.3687,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"2143","name_sl":"Piščančja klobasa debrecinka 320 g - IK","name_hr":"Piščančja klobasa debrecinka 320 g - IK","unit":"kg","industry_code":"fresh-meat","lc":1.76,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"641","name_sl":"File pišč. - gastro","name_hr":"File pišč. - gastro","unit":"kg","industry_code":"fresh-meat","lc":4.0536,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"93","name_sl":"Bedra gastro -IK","name_hr":"Bedra gastro -IK","unit":"kg","industry_code":"fresh-meat","lc":1.9604,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"252","name_sl":"Nabodala pišč. 400 g - IK","name_hr":"Nabodala pišč. 400 g - IK","unit":"kos","industry_code":"fresh-meat","lc":1.7914,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"367","name_sl":"Čevapčiči pišč. 400 g -Ik","name_hr":"Čevapčiči pišč. 400 g -Ik","unit":"kos","industry_code":"fresh-meat","lc":1.0556,"oh_factor":1.25,"min_profit_margin":0.08}'
    '{"code":"1485","name_sl":"suha salama narezek 100 g","name_hr":"suha salama narezek 100 g","unit":"kos","industry_code":"meat-products","lc":1.1413,"oh_factor":1.25,"min_profit_margin":0.08}'
)

# Insert each product
for product in "${products[@]}"; do
    echo "Inserting product..."
    curl -X POST "${API_URL}/products" \
        -H "Content-Type: application/json" \
        -d "$product"
    echo ""
    echo ""
done

echo "✅ Done!"
